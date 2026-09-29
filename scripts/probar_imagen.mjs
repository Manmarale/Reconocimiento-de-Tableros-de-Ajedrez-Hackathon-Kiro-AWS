'use strict';

// Prueba de extremo a extremo con una IMAGEN REAL:
// imagen -> endpoint local (/api/transcribe -> Gemini) -> validación ->
// reintento único -> formateo B8 + Audio. Usa el MISMO orquestador que la app.

import { readFile } from 'node:fs/promises';
import { cargarSignografia } from '../src/cargarSignografia.js';
import { transcribir } from '../src/orquestador.js';

const RUTA_IMAGEN = process.argv[2] || 'scripts/diagrama_prueba.png';
const BASE = process.env.BASE_URL || 'http://localhost:3000';

const sig = await cargarSignografia();
const png = await readFile(RUTA_IMAGEN);
const base64 = png.toString('base64');

// Extractor real: llama al endpoint local igual que el cliente del navegador.
function crearExtractor() {
  return async (motivoPrevio) => {
    const resp = await fetch(`${BASE}/api/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consentimiento: true,
        mimeType: 'image/png',
        imagenBase64: base64,
        motivoPrevio: motivoPrevio ?? null,
      }),
    });
    if (!resp.ok) {
      const d = await resp.json().catch(() => ({}));
      throw new Error(d.error || `HTTP ${resp.status}`);
    }
    return resp.json();
  };
}

console.log(`Imagen: ${RUTA_IMAGEN} (${png.length} bytes)`);
console.log('Enviando al endpoint local con consentimiento...\n');

const resultado = await transcribir(crearExtractor(), sig, (estado) => {
  console.log(`  [estado] ${estado}`);
});

console.log('');
if (!resultado.ok) {
  console.log('RESULTADO: error recuperable');
  console.log('  codigo:', resultado.codigo);
  console.log('  mensaje:', resultado.mensaje);
  process.exit(0);
}

console.log('='.repeat(60));
console.log('SALIDA Braille B8:');
console.log(resultado.braille);
console.log('\nSALIDA Audio (lector de pantalla):');
console.log(resultado.audio);
console.log('='.repeat(60));
