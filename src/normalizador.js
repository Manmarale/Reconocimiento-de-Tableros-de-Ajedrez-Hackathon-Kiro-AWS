'use strict';

// Normaliza y ordena el tablero validado para que el formateo sea determinista (RNF3).
// Orden por bando: tipo (R,D,T,A,C,P), luego columna ascendente (a..h), luego fila ascendente (1..8).

const ORDEN_TIPO = { R: 0, D: 1, T: 2, A: 3, C: 4, P: 5 };
const ORDEN_COLOR_RESALTADO = { amarillo: 0, rojo: 1 };

function columna(casilla) {
  return casilla.charCodeAt(0); // 'a'..'h'
}
function fila(casilla) {
  return Number(casilla[1]); // 1..8
}

function ordenarPiezas(piezas) {
  return [...piezas].sort((a, b) => {
    if (ORDEN_TIPO[a.tipo] !== ORDEN_TIPO[b.tipo]) return ORDEN_TIPO[a.tipo] - ORDEN_TIPO[b.tipo];
    if (columna(a.casilla) !== columna(b.casilla)) return columna(a.casilla) - columna(b.casilla);
    return fila(a.casilla) - fila(b.casilla);
  });
}

function ordenarResaltadas(resaltadas) {
  return [...resaltadas].sort((a, b) => {
    if (ORDEN_COLOR_RESALTADO[a.color] !== ORDEN_COLOR_RESALTADO[b.color]) {
      return ORDEN_COLOR_RESALTADO[a.color] - ORDEN_COLOR_RESALTADO[b.color];
    }
    if (columna(a.casilla) !== columna(b.casilla)) return columna(a.casilla) - columna(b.casilla);
    return fila(a.casilla) - fila(b.casilla);
  });
}

/**
 * @param {{piezas:Array,resaltadas:Array,flechas:Array}} tablero validado
 * @returns {{blancas:Array,negras:Array,resaltadas:Array,flechas:Array}}
 */
export function normalizarTablero(tablero) {
  const blancas = ordenarPiezas(tablero.piezas.filter((p) => p.color === 'blanca'));
  const negras = ordenarPiezas(tablero.piezas.filter((p) => p.color === 'negra'));
  const resaltadas = ordenarResaltadas(tablero.resaltadas);
  const flechas = [...tablero.flechas]; // orden de entrada; el trazo ya está validado
  return { blancas, negras, resaltadas, flechas };
}

export { ORDEN_COLOR_RESALTADO };
