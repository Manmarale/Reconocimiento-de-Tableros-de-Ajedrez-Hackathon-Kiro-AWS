'use strict';

// Formateador Audio en español (R5). Texto natural por bando, en orden
// Rey, Dama, Torres, Alfiles, Caballos, Peones. Casillas en MAYÚSCULAS.
// Plurales concordados y "y" antes del último elemento.

import { normalizarTablero } from './normalizador.js';

const ORDEN_TIPO = ['R', 'D', 'T', 'A', 'C', 'P'];

function unirNatural(items) {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}

function grupoBando(sig, piezas) {
  const frases = [];
  for (const tipo of ORDEN_TIPO) {
    const grupo = piezas.filter((p) => p.tipo === tipo);
    if (grupo.length === 0) continue;
    const nombres = sig.piezas.nombresAudio[tipo];
    const sustantivo = grupo.length > 1 ? nombres.plural : nombres.singular;
    const casillas = unirNatural(grupo.map((p) => p.casilla.toUpperCase()));
    const preposicion = grupo.length > 1 ? 'en' : 'en';
    frases.push(`${sustantivo} ${preposicion} ${casillas}`);
  }
  return unirNatural(frases);
}

function frameResaltadas(resaltadas) {
  if (resaltadas.length === 0) return null;
  const lineas = [];
  for (const color of ['amarillo', 'rojo']) {
    const grupo = resaltadas.filter((r) => r.color === color);
    if (grupo.length === 0) continue;
    const casillas = unirNatural(grupo.map((r) => r.casilla.toUpperCase()));
    const plural = grupo.length > 1;
    lineas.push(`Resaltada${plural ? 's' : ''} en ${color} ${plural ? 'las casillas' : 'la casilla'} ${casillas}.`);
  }
  return lineas.join(' ');
}

function frameFlechas(flechas) {
  if (flechas.length === 0) return null;
  const partes = flechas.map((f) => `Flecha de ${f.origen.toUpperCase()} a ${f.destino.toUpperCase()}`);
  return `${partes.join('. ')}.`;
}

/**
 * Genera la transcripción Audio a partir de un tablero validado.
 * @param {object} tableroValidado
 * @param {object} signografia
 * @returns {string}
 */
export function formatearAudio(tableroValidado, signografia) {
  const { blancas, negras, resaltadas, flechas } = normalizarTablero(tableroValidado);
  const lineas = [];

  const b = grupoBando(signografia, blancas);
  lineas.push(`Blancas: ${b || 'sin piezas'}.`);
  const n = grupoBando(signografia, negras);
  lineas.push(`Negras: ${n || 'sin piezas'}.`);

  const resalte = frameResaltadas(resaltadas);
  if (resalte) lineas.push(resalte);

  const flecha = frameFlechas(flechas);
  if (flecha) lineas.push(flecha);

  return lineas.join('\n');
}
