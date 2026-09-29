'use strict';

// Carga signografia.json en Node (para pruebas y usos server-side).
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function cargarSignografia() {
  const texto = await readFile(join(__dirname, '..', 'signografia.json'), 'utf8');
  return JSON.parse(texto);
}
