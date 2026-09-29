# Transcriptor de Ajedrez ONCE

Aplicación web accesible que transcribe diagramas de ajedrez a **Braille Unicode B8** (compatible con Ebrai) y a **texto natural para lector de pantalla**.

## Qué es

Una herramienta especializada, no un descriptor de imágenes genérico. A partir de la imagen de un tablero produce dos salidas deterministas:

- **Braille B8 estricto**, la signografía oficial ONCE para ajedrez.
- **Texto Audio** en español, pensado para NVDA, Narrador y VoiceOver.

## Por qué

Las personas ciegas que estudian ajedrez necesitan diagramas en el estándar B8 real, no aproximaciones. En material de estudio, un dato inventado es peor que un error honesto: por eso la herramienta prefiere rechazar una lectura dudosa antes que adivinar.

## Objetivo

Permitir el estudio táctico autónomo de posiciones, resaltados y flechas, con operación completa por teclado y lector de pantalla (WCAG 2.2 AA) y sin comprometer la privacidad.

## Aspecto innovador

- **La IA no escribe el Braille.** Google Gemini solo entrega un JSON intermedio; el Braille y el Audio los genera un formateador **determinista y auditable** alimentado por `signografia.json` (fuente única de mapeos). El mismo JSON produce siempre la misma salida.
- **Rigor conservador.** Validación estricta (coordenadas `^[a-h][1-8]$`, enums, unicidad de casilla, máx. 16 piezas por bando, máx. un rey por color) con un **único reintento**. Una flecha ambigua es un error recuperable, nunca una conjetura.
- **Privacidad híbrida con consentimiento.** Interfaz e historial funcionan offline; una imagen solo viaja a Gemini tras consentimiento explícito, a través de un endpoint local, con la clave (`GEMINI_API_KEY`) exclusiva del entorno del servidor. No se almacenan imágenes.

## Arquitectura

```
Navegador (offline)                    Servidor local (Node)
├─ index.html / styles.css             ├─ server.mjs
├─ app.js  (consentimiento, UI)        │   └─ POST /api/transcribe → Gemini
├─ src/orquestador.js  (1 reintento)   │       (clave solo en el entorno)
├─ src/validador.js    (contrato R3)
├─ src/formateadorBraille.js  (B8)
├─ src/formateadorAudio.js
├─ src/normalizador.js
├─ src/historial.js    (IndexedDB)
└─ signografia.json    (fuente única de reglas B8)
```

El pipeline separa extracción, validación, normalización, formateo, UI e historial. Ningún componente duplica las reglas B8: todas viven en `signografia.json`.

## Uso

Requiere Node 18 o superior.

1. Copia `.env.example` a `.env` y define tu `GEMINI_API_KEY`. El archivo `.env` está en `.gitignore` y nunca se sirve al navegador.
2. Arranca el servidor local:
   ```bash
   node server.mjs
   ```
3. Abre `http://localhost:3000`, selecciona una imagen de tablero, acepta el consentimiento y obtén las dos transcripciones.

## Pruebas

Suite con el runner nativo de Node (sin dependencias externas):

```bash
node --test
```

Cubre validación (rango, duplicados, límites, enums, flecha ambigua), formateadores B8 y Audio, determinismo y el orquestador (éxito, reintento, doble fallo, flecha ambigua, fallo de runtime).

Demostración del flujo completo sin red:

```bash
node scripts/demo.mjs
```

## Privacidad

- La imagen, sus derivados, el JSON y las transcripciones no se almacenan en el historial; solo se guardan transcripciones válidas y metadatos mínimos.
- La clave de Gemini vive únicamente en el entorno del servidor; el endpoint local nunca la devuelve al cliente.
- El servidor bloquea el acceso HTTP a `.env`.

## Licencia

MIT.
