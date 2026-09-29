'use strict';

import test from 'node:test';
import assert from 'node:assert/strict';

import { cargarSignografia } from '../src/cargarSignografia.js';
import { validarContrato } from '../src/validador.js';
import { formatearBraille } from '../src/formateadorBraille.js';
import { formatearAudio } from '../src/formateadorAudio.js';

const sig = await cargarSignografia();

function tablero(piezas, resaltadas = [], flechas = []) {
  const { tablero: t } = validarContrato({
    tablero: { piezas, resaltadas, flechas },
    metadatos: { fuente: 'demo', timestamp: '2026-01-01T00:00:00.000Z' },
  });
  return t;
}

test('Caso 1: posición simple, Braille B8', () => {
  const t = tablero([
    { tipo: 'R', color: 'blanca', casilla: 'e1' },
    { tipo: 'D', color: 'blanca', casilla: 'd1' },
    { tipo: 'R', color: 'negra', casilla: 'e8' },
    { tipo: 'T', color: 'negra', casilla: 'a5' },
  ]);
  const braille = formatearBraille(t, sig);
  // Orden por tipo R,D,T,A,C,P: Rey antes que Dama; Torre antes que Rey en negras.
  assert.equal(braille, 'Blancas: Re\u2802 Dd\u2802\nNegras: Re\u2826 Ta\u2822');
});

test('Caso 1: posición simple, Audio', () => {
  const t = tablero([
    { tipo: 'R', color: 'blanca', casilla: 'e1' },
    { tipo: 'D', color: 'blanca', casilla: 'd1' },
    { tipo: 'R', color: 'negra', casilla: 'e8' },
    { tipo: 'T', color: 'negra', casilla: 'a5' },
  ]);
  const audio = formatearAudio(t, sig);
  assert.equal(audio, 'Blancas: Rey en E1 y Dama en D1.\nNegras: Rey en E8 y Torre en A5.');
});

test('Caso 2: con resaltado y flecha recta', () => {
  const t = tablero(
    [
      { tipo: 'R', color: 'blanca', casilla: 'e1' },
      { tipo: 'D', color: 'blanca', casilla: 'd1' },
      { tipo: 'R', color: 'negra', casilla: 'e8' },
      { tipo: 'T', color: 'negra', casilla: 'a5' },
    ],
    [{ casilla: 'g3', color: 'amarillo' }],
    [{ origen: 'd1', destino: 'd5', trazo: 'recto' }],
  );
  const braille = formatearBraille(t, sig);
  const audio = formatearAudio(t, sig);
  assert.equal(
    braille,
    'Blancas: Re\u2802 Dd\u2802\nNegras: Re\u2826 Ta\u2822\n)Resaltadas en amarillo la casilla g\u2812(\nFlechas: d\u2802-d\u2822',
  );
  assert.equal(
    audio,
    'Blancas: Rey en E1 y Dama en D1.\nNegras: Rey en E8 y Torre en A5.\nResaltada en amarillo la casilla G3.\nFlecha de D1 a D5.',
  );
});

test('Pluralización Audio: dos peones', () => {
  const t = tablero([
    { tipo: 'P', color: 'blanca', casilla: 'a2' },
    { tipo: 'P', color: 'blanca', casilla: 'b2' },
  ]);
  const audio = formatearAudio(t, sig);
  assert.equal(audio, 'Blancas: Peones en A2 y B2.\nNegras: sin piezas.');
});

test('Determinismo: mismo JSON => misma salida', () => {
  const piezas = [
    { tipo: 'C', color: 'blanca', casilla: 'f3' },
    { tipo: 'A', color: 'blanca', casilla: 'c4' },
  ];
  const a = formatearBraille(tablero(piezas), sig);
  const b = formatearBraille(tablero(piezas), sig);
  assert.equal(a, b);
});
