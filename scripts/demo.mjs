'use strict';

// Script de demostración: ejecuta el flujo completo (validación + formateo +
// orquestador con reintento) SIN red, usando extractores simulados, y muestra
// las salidas reales para documentar los casos del hackathon.

import { cargarSignografia } from '../src/cargarSignografia.js';
import { transcribir } from '../src/orquestador.js';

const sig = await cargarSignografia();
const meta = { fuente: 'usuario', timestamp: new Date().toISOString() };

function stub(tablero) {
  return async () => ({ tablero, metadatos: meta });
}

function separador(titulo) {
  console.log('\n' + '='.repeat(60));
  console.log(titulo);
  console.log('='.repeat(60));
}

// Caso 1: posición simple (4 piezas)
separador('CASO 1 — Posición simple (4 elementos)');
const c1 = await transcribir(
  stub({
    piezas: [
      { tipo: 'R', color: 'blanca', casilla: 'e1' },
      { tipo: 'D', color: 'blanca', casilla: 'd1' },
      { tipo: 'R', color: 'negra', casilla: 'e8' },
      { tipo: 'T', color: 'negra', casilla: 'a5' },
    ],
    resaltadas: [],
    flechas: [],
  }),
  sig,
);
console.log('ENTRADA (JSON de extracción):');
console.log('  Rey blanco e1, Dama blanca d1, Rey negro e8, Torre negra a5');
console.log('\nSALIDA Braille B8:\n' + c1.braille);
console.log('\nSALIDA Audio:\n' + c1.audio);

// Caso 2: con resaltado y flecha (7 elementos)
separador('CASO 2 — Con resaltado y flecha (7 elementos)');
const c2 = await transcribir(
  stub({
    piezas: [
      { tipo: 'R', color: 'blanca', casilla: 'e1' },
      { tipo: 'D', color: 'blanca', casilla: 'd1' },
      { tipo: 'R', color: 'negra', casilla: 'e8' },
      { tipo: 'T', color: 'negra', casilla: 'a5' },
    ],
    resaltadas: [{ casilla: 'g3', color: 'amarillo' }],
    flechas: [{ origen: 'd1', destino: 'd5', trazo: 'recto' }],
  }),
  sig,
);
console.log('ENTRADA (JSON de extracción):');
console.log('  4 piezas + resaltada amarillo g3 + flecha d1->d5 (recto)');
console.log('\nSALIDA Braille B8:\n' + c2.braille);
console.log('\nSALIDA Audio:\n' + c2.audio);

// Caso 3: flecha ambigua -> rechazo conservador
separador('CASO 3 — Flecha ambigua (rechazo conservador)');
let intentos = 0;
const c3 = await transcribir(
  async () => {
    intentos += 1;
    return {
      tablero: { piezas: [], resaltadas: [], flechas: [{ origen: 'd1', destino: 'd5' }] },
      metadatos: meta,
    };
  },
  sig,
);
console.log('ENTRADA (JSON de extracción):');
console.log('  Flecha con trazo no clasificable (ausente)');
console.log(`\nIntentos realizados: ${intentos} (1 original + 1 reintento)`);
console.log('SALIDA:');
console.log('  ok: ' + c3.ok);
console.log('  codigo: ' + c3.codigo);
console.log('  mensaje: ' + c3.mensaje);

console.log('\n' + '='.repeat(60));
console.log('Fin de la demostración. Todo se ejecuta localmente, sin red.');
