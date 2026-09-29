'use strict';

// Servidor local del Transcriptor ONCE.
// - Sirve los archivos estáticos de la interfaz.
// - Expone POST /api/transcribe: recibe una imagen (base64) SOLO tras consentimiento
//   y llama a Google Gemini con la clave del entorno del servidor.
// La clave (GEMINI_API_KEY) nunca se envía al navegador ni aparece en respuestas.
//
// No usa dependencias externas: sólo módulos nativos de Node.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Carga mínima de .env sin dependencias (solo para desarrollo local).
async function cargarEnv() {
  try {
    const texto = await readFile(join(__dirname, '.env'), 'utf8');
    for (const linea of texto.split('\n')) {
      const limpia = linea.trim();
      if (!limpia || limpia.startsWith('#')) continue;
      const idx = limpia.indexOf('=');
      if (idx === -1) continue;
      const clave = limpia.slice(0, idx).trim();
      const valor = limpia.slice(idx + 1).trim();
      if (!(clave in process.env)) process.env[clave] = valor;
    }
  } catch {
    // Sin .env: se usarán variables de entorno reales del sistema.
  }
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

const PROMPT_EXTRACCION = `Analiza exclusivamente la imagen adjunta de un tablero de ajedrez desde la perspectiva de las piezas blancas.
Columnas a..h de izquierda a derecha; filas 1..8 de abajo hacia arriba.
Tipos de pieza: R (rey), D (dama), T (torre), A (alfil), C (caballo), P (peón).
Cada casilla debe cumplir ^[a-h][1-8]$. Colores de resaltado: amarillo o rojo. Trazos de flecha: recto, diagonal o curvo.
Si un elemento no puede determinarse con fiabilidad, no lo inventes.
Devuelve ÚNICAMENTE JSON válido con esta forma exacta:
{"tablero":{"piezas":[{"tipo":"R","color":"blanca","casilla":"e1"}],"resaltadas":[{"casilla":"g3","color":"amarillo"}],"flechas":[{"origen":"d1","destino":"d5","trazo":"recto"}]},"metadatos":{"fuente":"usuario","timestamp":"ISO8601"}}
No generes Braille, texto Audio, explicaciones ni Markdown.`;

async function leerCuerpo(req, limiteBytes = 12 * 1024 * 1024) {
  const trozos = [];
  let total = 0;
  for await (const trozo of req) {
    total += trozo.length;
    if (total > limiteBytes) throw new Error('Cuerpo demasiado grande.');
    trozos.push(trozo);
  }
  return Buffer.concat(trozos).toString('utf8');
}

async function llamarGemini({ imagenBase64, mimeType, motivoPrevio }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelo = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  if (!apiKey) {
    const err = new Error('Falta GEMINI_API_KEY en el entorno del servidor.');
    err.codigo = 'SIN_CLAVE';
    throw err;
  }

  const promptTexto = motivoPrevio
    ? `${PROMPT_EXTRACCION}\nEl intento anterior fue inválido por: ${motivoPrevio}. Corrige y responde solo con el JSON.`
    : PROMPT_EXTRACCION;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:generateContent?key=${apiKey}`;
  const cuerpo = {
    contents: [
      {
        role: 'user',
        parts: [{ text: promptTexto }, { inline_data: { mime_type: mimeType, data: imagenBase64 } }],
      },
    ],
    generationConfig: { responseMimeType: 'application/json', temperature: 0 },
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });

  if (!resp.ok) {
    const err = new Error(`Gemini respondió ${resp.status}.`);
    err.codigo = 'GEMINI_ERROR';
    throw err;
  }

  const data = await resp.json();
  const texto = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
  return JSON.parse(texto);
}

async function servirEstatico(req, res) {
  let ruta = decodeURIComponent(new URL(req.url, 'http://local').pathname);
  if (ruta === '/') ruta = '/index.html';
  const abs = normalize(join(__dirname, ruta));
  if (!abs.startsWith(__dirname)) {
    res.writeHead(403).end('Prohibido');
    return;
  }
  // No servir secretos.
  if (abs.endsWith('.env') || abs.includes(`${'/'}.env`)) {
    res.writeHead(404).end('No encontrado');
    return;
  }
  try {
    const contenido = await readFile(abs);
    res.writeHead(200, { 'Content-Type': MIME[extname(abs)] || 'application/octet-stream' });
    res.end(contenido);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('No encontrado');
  }
}

const servidor = createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/transcribe') {
    try {
      const cuerpo = JSON.parse(await leerCuerpo(req));
      if (cuerpo.consentimiento !== true) {
        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Se requiere consentimiento explícito para enviar la imagen.' }));
        return;
      }
      if (!cuerpo.imagenBase64 || !cuerpo.mimeType) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Faltan imagenBase64 o mimeType.' }));
        return;
      }
      const json = await llamarGemini({
        imagenBase64: cuerpo.imagenBase64,
        mimeType: cuerpo.mimeType,
        motivoPrevio: cuerpo.motivoPrevio ?? null,
      });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(json)); // Solo el JSON de extracción; nunca la clave.
    } catch (e) {
      // No filtrar detalles sensibles ni la clave.
      const codigo = e?.codigo || 'ERROR';
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'No se pudo obtener la extracción.', codigo }));
    }
    return;
  }

  if (req.method === 'GET') {
    await servirEstatico(req, res);
    return;
  }

  res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Método no permitido');
});

await cargarEnv();
const PORT = Number(process.env.PORT) || 3000;
servidor.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Transcriptor ONCE escuchando en http://localhost:${PORT}`);
});
