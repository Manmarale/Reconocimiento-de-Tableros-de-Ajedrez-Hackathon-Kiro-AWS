'use strict';

// Validación del contrato JSON intermedio (R3 del spec).
// No formatea ni normaliza: solo comprueba forma e invariantes de negocio.
// Devuelve { ok: true, tablero, metadatos } o lanza ErrorValidacion tipado.

export const TIPOS_PIEZA = ['R', 'D', 'T', 'A', 'C', 'P'];
export const COLORES_PIEZA = ['blanca', 'negra'];
export const COLORES_RESALTADO = ['amarillo', 'rojo'];
export const TRAZOS_FLECHA = ['recto', 'diagonal', 'curvo'];

const RE_CASILLA = /^[a-h][1-8]$/;

export class ErrorValidacion extends Error {
  constructor(codigo, mensaje) {
    super(mensaje);
    this.name = 'ErrorValidacion';
    this.codigo = codigo;
  }
}

function esObjeto(valor) {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function validarCasilla(casilla, contexto) {
  if (typeof casilla !== 'string' || !RE_CASILLA.test(casilla)) {
    throw new ErrorValidacion(
      'CASILLA_INVALIDA',
      `Casilla fuera de rango en ${contexto}: ${JSON.stringify(casilla)}. Debe cumplir ^[a-h][1-8]$.`,
    );
  }
}

function validarPiezas(piezas) {
  if (!Array.isArray(piezas)) {
    throw new ErrorValidacion('PIEZAS_NO_ARRAY', 'El campo tablero.piezas debe ser un array.');
  }
  const ocupadas = new Set();
  const conteo = { blanca: 0, negra: 0 };
  const reyes = { blanca: 0, negra: 0 };

  for (const pieza of piezas) {
    if (!esObjeto(pieza)) {
      throw new ErrorValidacion('PIEZA_MALFORMADA', 'Cada pieza debe ser un objeto con tipo, color y casilla.');
    }
    if (!TIPOS_PIEZA.includes(pieza.tipo)) {
      throw new ErrorValidacion('TIPO_INVALIDO', `Tipo de pieza inválido: ${JSON.stringify(pieza.tipo)}.`);
    }
    if (!COLORES_PIEZA.includes(pieza.color)) {
      throw new ErrorValidacion('COLOR_INVALIDO', `Color de pieza inválido: ${JSON.stringify(pieza.color)}.`);
    }
    validarCasilla(pieza.casilla, 'pieza');

    if (ocupadas.has(pieza.casilla)) {
      throw new ErrorValidacion('CASILLA_DUPLICADA', `Más de una pieza en la casilla ${pieza.casilla}.`);
    }
    ocupadas.add(pieza.casilla);

    conteo[pieza.color] += 1;
    if (pieza.tipo === 'R') reyes[pieza.color] += 1;
  }

  for (const color of COLORES_PIEZA) {
    if (conteo[color] > 16) {
      throw new ErrorValidacion('EXCESO_PIEZAS', `Más de 16 piezas ${color}s (${conteo[color]}).`);
    }
    if (reyes[color] > 1) {
      throw new ErrorValidacion('EXCESO_REYES', `Más de un rey ${color}.`);
    }
  }

  return piezas;
}

function validarResaltadas(resaltadas) {
  if (!Array.isArray(resaltadas)) {
    throw new ErrorValidacion('RESALTADAS_NO_ARRAY', 'El campo tablero.resaltadas debe ser un array.');
  }
  const vistas = new Set();
  for (const r of resaltadas) {
    if (!esObjeto(r)) {
      throw new ErrorValidacion('RESALTADA_MALFORMADA', 'Cada resaltada debe ser objeto con casilla y color.');
    }
    validarCasilla(r.casilla, 'resaltada');
    if (!COLORES_RESALTADO.includes(r.color)) {
      throw new ErrorValidacion('COLOR_RESALTADO_INVALIDO', `Color de resaltado inválido: ${JSON.stringify(r.color)}.`);
    }
    const clave = `${r.casilla}:${r.color}`;
    if (vistas.has(clave)) {
      throw new ErrorValidacion('RESALTADA_DUPLICADA', `Resaltado duplicado ${clave}.`);
    }
    vistas.add(clave);
  }
  return resaltadas;
}

function validarFlechas(flechas) {
  if (!Array.isArray(flechas)) {
    throw new ErrorValidacion('FLECHAS_NO_ARRAY', 'El campo tablero.flechas debe ser un array.');
  }
  for (const f of flechas) {
    if (!esObjeto(f)) {
      throw new ErrorValidacion('FLECHA_MALFORMADA', 'Cada flecha debe ser objeto con origen, destino y trazo.');
    }
    validarCasilla(f.origen, 'flecha.origen');
    validarCasilla(f.destino, 'flecha.destino');
    if (f.origen === f.destino) {
      throw new ErrorValidacion('FLECHA_NULA', `Flecha con origen y destino iguales: ${f.origen}.`);
    }
    // Flecha ambigua: trazo ausente o fuera de enum es fallo de extracción, no conjetura.
    if (!TRAZOS_FLECHA.includes(f.trazo)) {
      throw new ErrorValidacion(
        'FLECHA_AMBIGUA',
        `Trazo de flecha no clasificable con fiabilidad: ${JSON.stringify(f.trazo)}. Debe ser recto, diagonal o curvo.`,
      );
    }
  }
  return flechas;
}

function validarMetadatos(metadatos) {
  if (!esObjeto(metadatos)) {
    throw new ErrorValidacion('METADATOS_MALFORMADOS', 'El campo metadatos debe ser un objeto.');
  }
  if (!['usuario', 'demo'].includes(metadatos.fuente)) {
    throw new ErrorValidacion('FUENTE_INVALIDA', `Fuente inválida: ${JSON.stringify(metadatos.fuente)}.`);
  }
  const ts = metadatos.timestamp;
  if (typeof ts !== 'string' || Number.isNaN(Date.parse(ts))) {
    throw new ErrorValidacion('TIMESTAMP_INVALIDO', `Timestamp ISO 8601 inválido: ${JSON.stringify(ts)}.`);
  }
  return metadatos;
}

/**
 * Valida el contrato completo. Lanza ErrorValidacion en el primer fallo.
 * @param {unknown} datos
 * @returns {{ ok: true, tablero: object, metadatos: object }}
 */
export function validarContrato(datos) {
  if (!esObjeto(datos)) {
    throw new ErrorValidacion('RAIZ_INVALIDA', 'La respuesta debe ser un objeto JSON.');
  }
  if (!esObjeto(datos.tablero)) {
    throw new ErrorValidacion('TABLERO_INVALIDO', 'Falta el objeto tablero.');
  }

  const piezas = validarPiezas(datos.tablero.piezas ?? []);
  const resaltadas = validarResaltadas(datos.tablero.resaltadas ?? []);
  const flechas = validarFlechas(datos.tablero.flechas ?? []);
  const metadatos = validarMetadatos(datos.metadatos ?? { fuente: 'usuario', timestamp: new Date().toISOString() });

  return {
    ok: true,
    tablero: { piezas, resaltadas, flechas },
    metadatos,
  };
}
