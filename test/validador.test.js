'use strict';

import test from 'node:test';
import assert from 'node:assert/strict';

import { validarContrato, ErrorValidacion } from '../src/validador.js';

const meta = { fuente: 'usuario', timestamp: '2026-01-01T00:00:00.000Z' };

function contrato(piezas, resaltadas = [], flechas = []) {
  return { tablero: { piezas, resaltadas, flechas }, metadatos: meta };
}

test('acepta un contrato válido con listas vacías', () => {
  const r = validarContrato(contrato([]));
  assert.equal(r.ok, true);
});

test('rechaza casilla fuera de rango', () => {
  assert.throws(
    () => validarContrato(contrato([{ tipo: 'R', color: 'blanca', casilla: 'i9' }])),
    (e) => e instanceof ErrorValidacion && e.codigo === 'CASILLA_INVALIDA',
  );
});

test('rechaza pieza duplicada en la misma casilla', () => {
  assert.throws(
    () =>
      validarContrato(
        contrato([
          { tipo: 'R', color: 'blanca', casilla: 'e1' },
          { tipo: 'D', color: 'blanca', casilla: 'e1' },
        ]),
      ),
    (e) => e.codigo === 'CASILLA_DUPLICADA',
  );
});

test('rechaza más de un rey por color', () => {
  assert.throws(
    () =>
      validarContrato(
        contrato([
          { tipo: 'R', color: 'blanca', casilla: 'e1' },
          { tipo: 'R', color: 'blanca', casilla: 'e2' },
        ]),
      ),
    (e) => e.codigo === 'EXCESO_REYES',
  );
});

test('rechaza más de 16 piezas por bando', () => {
  const piezas = [];
  const columnas = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  // 17 peones blancos repartidos en casillas distintas
  let n = 0;
  for (const fila of [2, 3, 4]) {
    for (const col of columnas) {
      if (n >= 17) break;
      piezas.push({ tipo: 'P', color: 'blanca', casilla: `${col}${fila}` });
      n += 1;
    }
  }
  assert.throws(() => validarContrato(contrato(piezas)), (e) => e.codigo === 'EXCESO_PIEZAS');
});

test('rechaza enum de color de resaltado inválido', () => {
  assert.throws(
    () => validarContrato(contrato([], [{ casilla: 'g3', color: 'verde' }])),
    (e) => e.codigo === 'COLOR_RESALTADO_INVALIDO',
  );
});

test('trata la flecha ambigua (trazo ausente) como error', () => {
  assert.throws(
    () => validarContrato(contrato([], [], [{ origen: 'd1', destino: 'd5' }])),
    (e) => e.codigo === 'FLECHA_AMBIGUA',
  );
});
