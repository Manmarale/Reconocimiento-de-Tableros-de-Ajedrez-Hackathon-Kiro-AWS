'use strict';

// Orquestador del pipeline (R3/R7). Coordina extracción → validación → formateo
// con un ÚNICO reintento condicionado por error de validación. No formatea antes
// de validar y no persiste resultados inválidos.

import { validarContrato, ErrorValidacion } from './validador.js';
import { formatearBraille } from './formateadorBraille.js';
import { formatearAudio } from './formateadorAudio.js';

/**
 * @param {(motivoPrevio: string|null) => Promise<object>} extraer
 *   Función que devuelve el JSON crudo del extractor (Gemini vía endpoint local,
 *   o un stub en pruebas). Recibe el motivo del fallo anterior en el reintento.
 * @param {object} signografia
 * @param {(estado: string, detalle?: string) => void} [onEstado]
 *   Callback opcional para anunciar estados accesibles (role="log").
 * @returns {Promise<{ok:true, tablero, metadatos, braille, audio} | {ok:false, codigo, mensaje}>}
 */
export async function transcribir(extraer, signografia, onEstado = () => {}) {
  const MAX_INTENTOS = 2; // primer intento + un único reintento
  let motivoPrevio = null;

  for (let intento = 1; intento <= MAX_INTENTOS; intento += 1) {
    onEstado(intento === 1 ? 'analizando' : 'reintentando', motivoPrevio ?? undefined);

    let crudo;
    try {
      crudo = await extraer(motivoPrevio);
    } catch (e) {
      // Fallo del runtime/endpoint: error recuperable, sin fallback remoto silencioso.
      return { ok: false, codigo: 'EXTRACCION_FALLIDA', mensaje: mensajeRuntime(e) };
    }

    try {
      const { tablero, metadatos } = validarContrato(crudo);
      const braille = formatearBraille(tablero, signografia);
      const audio = formatearAudio(tablero, signografia);
      onEstado('resultados_listos');
      return { ok: true, tablero, metadatos, braille, audio };
    } catch (e) {
      if (!(e instanceof ErrorValidacion)) throw e;
      motivoPrevio = `${e.codigo}: ${e.message}`;
      if (intento === MAX_INTENTOS) {
        onEstado('error', motivoPrevio);
        return { ok: false, codigo: e.codigo, mensaje: mensajeAccesible(e) };
      }
      // Continúa al reintento con el motivo.
    }
  }

  // Inalcanzable, pero mantiene el contrato de retorno.
  return { ok: false, codigo: 'DESCONOCIDO', mensaje: 'No se pudo completar la transcripción.' };
}

function mensajeAccesible(error) {
  if (error.codigo === 'FLECHA_AMBIGUA') {
    return 'No se puede interpretar el trazo de la flecha con fiabilidad. La imagen no se ha guardado. Elige otra imagen o inténtalo de nuevo.';
  }
  return `No se pudo interpretar el diagrama con fiabilidad (${error.codigo}). La imagen no se ha guardado. Elige otra imagen o inténtalo de nuevo.`;
}

function mensajeRuntime(error) {
  return `No se pudo completar el análisis. ${error?.message ?? ''} Comprueba tu conexión con el servidor local y vuelve a intentarlo.`.trim();
}
