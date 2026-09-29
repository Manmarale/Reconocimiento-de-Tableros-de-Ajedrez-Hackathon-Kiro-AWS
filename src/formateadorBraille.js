'use strict';

// Formateador Braille Unicode B8 puro (R4). No genera texto libre: solo aplica
// las reglas de signografia.json de forma determinista.
//
// Formato por pieza: inicial + columna + dígito bajo. Ej: Re⠂  (Rey en e1).
// Piezas separadas por un espacio, sin comas ni punto y coma.
// Bloques: "Blancas: ..." y "Negras: ...".
// Resaltados en bloque posterior con paréntesis invertidos: )Resaltadas ...(
// Flechas después de resaltados: origen-destino con dígitos bajos.

import { normalizarTablero } from './normalizador.js';

function digitoBajo(sig, casilla) {
  return sig.coordenadas.filasBraille[casilla[1]];
}

// col+fila en formato Braille: columna latina minúscula + dígito bajo. Ej: e1 -> e⠂
function casillaBraille(sig, casilla) {
  return casilla[0] + digitoBajo(sig, casilla);
}

function piezaBraille(sig, pieza) {
  return pieza.tipo + casillaBraille(sig, pieza.casilla);
}

function bloquePiezas(sig, etiqueta, piezas) {
  const cuerpo = piezas.map((p) => piezaBraille(sig, p)).join(' ');
  return `${etiqueta}: ${cuerpo}`;
}

function bloqueResaltadas(sig, resaltadas) {
  if (resaltadas.length === 0) return null;
  // Agrupar por color en orden amarillo, rojo.
  const lineas = [];
  for (const color of sig.resaltados.ordenColores) {
    const grupo = resaltadas.filter((r) => r.color === color);
    if (grupo.length === 0) continue;
    const casillas = grupo.map((r) => casillaBraille(sig, r.casilla));
    const plural = casillas.length > 1;
    const sustantivo = plural ? 'las casillas' : 'la casilla';
    const conector = plural ? unirCon(casillas, 'y') : casillas[0];
    lineas.push(`)Resaltadas en ${color} ${sustantivo} ${conector}(`);
  }
  return lineas.join('\n');
}

function unirCon(items, conjuncion) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(' ')} ${conjuncion} ${items[items.length - 1]}`;
}

function conectorFlecha(sig, trazo) {
  return sig.flechas.conectores[trazo];
}

function bloqueFlechas(sig, flechas) {
  if (flechas.length === 0) return null;
  const partes = flechas.map((f) => {
    const conector = conectorFlecha(sig, f.trazo);
    return `${casillaBraille(sig, f.origen)}${conector}${casillaBraille(sig, f.destino)}`;
  });
  return `Flechas: ${partes.join(' ')}`;
}

/**
 * Genera la transcripción Braille B8 a partir de un tablero validado.
 * @param {object} tableroValidado
 * @param {object} signografia
 * @returns {string}
 */
export function formatearBraille(tableroValidado, signografia) {
  const { blancas, negras, resaltadas, flechas } = normalizarTablero(tableroValidado);
  const lineas = [bloquePiezas(signografia, 'Blancas', blancas), bloquePiezas(signografia, 'Negras', negras)];

  const resalte = bloqueResaltadas(signografia, resaltadas);
  if (resalte) lineas.push(resalte);

  const flecha = bloqueFlechas(signografia, flechas);
  if (flecha) lineas.push(flecha);

  return lineas.join('\n');
}
