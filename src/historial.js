'use strict';

// Repositorio de historial local (R6). Persiste SOLO transcripciones válidas y
// metadatos mínimos; nunca imágenes ni JSON no validado. Usa IndexedDB en el
// navegador y un repositorio en memoria como reserva (y para pruebas).

const NOMBRE_BD = 'transcriptor-once';
const ALMACEN = 'transcripciones';
const VERSION_BD = 1;

function generarId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Construye el registro que sí se persiste (sin imagen).
export function construirRegistro({ tablero, metadatos, braille, audio, versionSignografia, nombreOpcional }) {
  return {
    id: generarId(),
    creadoEn: new Date().toISOString(),
    fuente: metadatos?.fuente ?? 'usuario',
    nombreOpcional: nombreOpcional ?? null,
    tableroValidado: tablero,
    brailleUnicode: braille,
    audioTexto: audio,
    versionSignografia: versionSignografia ?? null,
  };
}

class RepositorioMemoria {
  constructor() {
    this.registros = [];
  }
  async guardar(registro) {
    this.registros.unshift(registro);
    return registro.id;
  }
  async listar() {
    return [...this.registros].sort((a, b) => (a.creadoEn < b.creadoEn ? 1 : -1));
  }
  async obtener(id) {
    return this.registros.find((r) => r.id === id) ?? null;
  }
  async borrar(id) {
    this.registros = this.registros.filter((r) => r.id !== id);
  }
  async borrarTodo() {
    this.registros = [];
  }
}

class RepositorioIndexedDB {
  constructor(db) {
    this.db = db;
  }
  static disponible() {
    return typeof indexedDB !== 'undefined';
  }
  static abrir() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(NOMBRE_BD, VERSION_BD);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(ALMACEN)) {
          const store = db.createObjectStore(ALMACEN, { keyPath: 'id' });
          store.createIndex('creadoEn', 'creadoEn');
        }
      };
      req.onsuccess = () => resolve(new RepositorioIndexedDB(req.result));
      req.onerror = () => reject(req.error);
    });
  }
  _tx(modo) {
    return this.db.transaction(ALMACEN, modo).objectStore(ALMACEN);
  }
  guardar(registro) {
    return new Promise((resolve, reject) => {
      const req = this._tx('readwrite').put(registro);
      req.onsuccess = () => resolve(registro.id);
      req.onerror = () => reject(req.error);
    });
  }
  listar() {
    return new Promise((resolve, reject) => {
      const req = this._tx('readonly').getAll();
      req.onsuccess = () => resolve(req.result.sort((a, b) => (a.creadoEn < b.creadoEn ? 1 : -1)));
      req.onerror = () => reject(req.error);
    });
  }
  obtener(id) {
    return new Promise((resolve, reject) => {
      const req = this._tx('readonly').get(id);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  }
  borrar(id) {
    return new Promise((resolve, reject) => {
      const req = this._tx('readwrite').delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
  borrarTodo() {
    return new Promise((resolve, reject) => {
      const req = this._tx('readwrite').clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

/** Devuelve el mejor repositorio disponible en el entorno actual. */
export async function crearRepositorio() {
  if (RepositorioIndexedDB.disponible()) {
    try {
      return await RepositorioIndexedDB.abrir();
    } catch {
      return new RepositorioMemoria();
    }
  }
  return new RepositorioMemoria();
}

export { RepositorioMemoria };
