'use strict';

import test from 'node:test';
import assert from 'node:assert/strict';

import { cargarSignografia } from '../src/cargarSignografia.js';
import { transcribir } from '../src/orquestador.js';

const sig = await cargarSignografia();
const meta = { fuente: 'usuario', timestamp: '2026-01-01T00:00:00.000Z' };

test('éxito al primer intento', async () => {
  const extraer = async () => ({
    tablero: { piezas: [{ tipo: 'R', color: 'blanca', casilla: 'e1' }], resaltadas: [], flechas: [] },
    metadatos: meta,
  });
  const r = await transcribir(extraer, sig);
  assert.equal(r.ok, true);
  assert.match(r.braille, /^Blancas: Re/);
});

test('primer JSON inválido, reintento correcto', async () => {
  let intentos = 0;
  const extraer = async (motivoPrevio) => {
    intentos += 1;
    if (intentos === 1) {
      return { tablero: { piezas: [{ tipo: 'R', color: 'blanca', casilla: 'z9' }], resaltadas: [], flechas: [] }, metadatos: meta };
    }
    assert.ok(motivoPrevio, 'el reintento debe recibir el motivo del fallo');
    return { tablero: { piezas: [{ tipo: 'R', color: 'blanca', casilla: 'e1' }], resaltadas: [], flechas: [] }, metadatos: meta };
  };
  const r = await transcribir(extraer, sig);
  assert.equal(r.ok, true);
  assert.equal(intentos, 2);
});

test('dos fallos consecutivos: error accesible, sin resultado', async () => {
  let intentos = 0;
  const extraer = async () => {
    intentos += 1;
    return { tablero: { piezas: [{ tipo: 'R', color: 'blanca', casilla: 'z9' }], resaltadas: [], flechas: [] }, metadatos: meta };
  };
  const r = await transcribir(extraer, sig);
  assert.equal(r.ok, false);
  assert.equal(intentos, 2); // no hay tercer intento
  assert.ok(r.mensaje.includes('no se ha guardado'));
});

test('flecha ambigua produce error accesible específico', async () => {
  const extraer = async () => ({
    tablero: { piezas: [], resaltadas: [], flechas: [{ origen: 'd1', destino: 'd5' }] },
    metadatos: meta,
  });
  const r = await transcribir(extraer, sig);
  assert.equal(r.ok, false);
  assert.equal(r.codigo, 'FLECHA_AMBIGUA');
});

test('fallo del runtime de extracción es recuperable', async () => {
  const extraer = async () => {
    throw new Error('endpoint caído');
  };
  const r = await transcribir(extraer, sig);
  assert.equal(r.ok, false);
  assert.equal(r.codigo, 'EXTRACCION_FALLIDA');
});
