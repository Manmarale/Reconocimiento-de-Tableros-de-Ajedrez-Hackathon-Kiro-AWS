'use strict';

// Cliente accesible del Transcriptor ONCE. Coordina consentimiento, envío al
// endpoint local, formateo local (determinista) e historial. No expone la clave
// (la maneja el servidor) y no guarda imágenes.

import { transcribir } from './src/orquestador.js';
import { crearRepositorio, construirRegistro } from './src/historial.js';

const $ = (sel) => document.querySelector(sel);

const el = {
  form: $('#form-transcribir'),
  archivo: $('#archivo-imagen'),
  nombre: $('#nombre-opcional'),
  estado: $('#estado'),
  alerta: $('#alerta'),
  seccionResultados: $('#seccion-resultados'),
  salidaBraille: $('#salida-braille'),
  salidaAudio: $('#salida-audio'),
  copiarBraille: $('#copiar-braille'),
  copiarAudio: $('#copiar-audio'),
  listaHistorial: $('#lista-historial'),
  historialVacio: $('#historial-vacio'),
  borrarTodo: $('#borrar-todo'),
  dialogo: $('#dialogo-consentimiento'),
  aceptar: $('#consentir-aceptar'),
  rechazar: $('#consentir-rechazar'),
};

const MENSAJES_ESTADO = {
  analizando: 'Analizando el diagrama.',
  reintentando: 'La primera lectura no fue válida. Reintentando una vez.',
  resultados_listos: 'Resultados listos.',
  error: 'No se pudo completar la transcripción.',
};

let signografia = null;
let repositorio = null;

async function cargarSignografia() {
  const resp = await fetch('signografia.json');
  signografia = await resp.json();
}

function anunciar(mensaje) {
  el.estado.textContent = mensaje;
}

function mostrarAlerta(mensaje) {
  el.alerta.textContent = mensaje;
  el.alerta.hidden = false;
  el.alerta.focus();
}

function ocultarAlerta() {
  el.alerta.hidden = true;
  el.alerta.textContent = '';
}

function onEstado(clave) {
  if (MENSAJES_ESTADO[clave]) anunciar(MENSAJES_ESTADO[clave]);
}

function leerArchivoComoBase64(file) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => {
      const resultado = String(lector.result);
      const base64 = resultado.slice(resultado.indexOf(',') + 1);
      resolve({ base64, mimeType: file.type });
    };
    lector.onerror = () => reject(lector.error);
    lector.readAsDataURL(file);
  });
}

// Muestra el diálogo de consentimiento y resuelve con true/false.
function pedirConsentimiento() {
  return new Promise((resolve) => {
    const previo = document.activeElement;
    el.dialogo.hidden = false;
    el.aceptar.focus();

    const cerrar = (valor) => {
      el.dialogo.hidden = true;
      el.aceptar.removeEventListener('click', onAceptar);
      el.rechazar.removeEventListener('click', onRechazar);
      document.removeEventListener('keydown', onKey);
      if (previo && previo.focus) previo.focus();
      resolve(valor);
    };
    const onAceptar = () => cerrar(true);
    const onRechazar = () => cerrar(false);
    const onKey = (e) => {
      if (e.key === 'Escape') cerrar(false);
    };

    el.aceptar.addEventListener('click', onAceptar);
    el.rechazar.addEventListener('click', onRechazar);
    document.addEventListener('keydown', onKey);
  });
}

// Crea la función de extracción que llama al endpoint local con la imagen.
function crearExtractor(imagen, consentimiento) {
  return async (motivoPrevio) => {
    const resp = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consentimiento,
        imagenBase64: imagen.base64,
        mimeType: imagen.mimeType,
        motivoPrevio: motivoPrevio ?? null,
      }),
    });
    if (!resp.ok) {
      const detalle = await resp.json().catch(() => ({}));
      const err = new Error(detalle.error || `El servidor respondió ${resp.status}.`);
      throw err;
    }
    return resp.json();
  };
}

async function onSubmit(evento) {
  evento.preventDefault();
  ocultarAlerta();
  el.seccionResultados.hidden = true;

  const file = el.archivo.files?.[0];
  if (!file) {
    mostrarAlerta('Selecciona una imagen del tablero antes de transcribir.');
    return;
  }

  const consentimiento = await pedirConsentimiento();
  if (!consentimiento) {
    anunciar('Transcripción cancelada. La imagen no se ha enviado.');
    return;
  }

  let imagen;
  try {
    imagen = await leerArchivoComoBase64(file);
  } catch {
    mostrarAlerta('No se pudo leer el archivo seleccionado. Prueba con otra imagen.');
    return;
  }

  const extraer = crearExtractor(imagen, consentimiento);
  const resultado = await transcribir(extraer, signografia, onEstado);

  if (!resultado.ok) {
    mostrarAlerta(resultado.mensaje);
    return;
  }

  el.salidaBraille.textContent = resultado.braille;
  el.salidaAudio.textContent = resultado.audio;
  el.seccionResultados.hidden = false;

  const registro = construirRegistro({
    tablero: resultado.tablero,
    metadatos: resultado.metadatos,
    braille: resultado.braille,
    audio: resultado.audio,
    versionSignografia: signografia.version,
    nombreOpcional: el.nombre.value.trim() || null,
  });
  await repositorio.guardar(registro);
  await pintarHistorial();
  anunciar('Resultados listos y guardados en el historial.');
}

async function copiar(texto, etiqueta) {
  try {
    await navigator.clipboard.writeText(texto);
    anunciar(`${etiqueta} copiado al portapapeles.`);
  } catch {
    anunciar(`No se pudo copiar ${etiqueta}.`);
  }
}

async function pintarHistorial() {
  const registros = await repositorio.listar();
  el.listaHistorial.textContent = '';
  el.historialVacio.hidden = registros.length > 0;
  el.borrarTodo.hidden = registros.length === 0;

  for (const r of registros) {
    const item = document.createElement('li');
    item.className = 'historial-item';

    const titulo = document.createElement('h3');
    const fecha = new Date(r.creadoEn).toLocaleString('es-ES');
    titulo.textContent = r.nombreOpcional ? `${r.nombreOpcional} · ${fecha}` : fecha;
    item.appendChild(titulo);

    const resumen = document.createElement('p');
    const numPiezas = r.tableroValidado.piezas.length;
    resumen.textContent = `${numPiezas} pieza${numPiezas === 1 ? '' : 's'} · fuente: ${r.fuente}`;
    item.appendChild(resumen);

    const acciones = document.createElement('div');
    acciones.className = 'historial-acciones';

    const abrir = document.createElement('button');
    abrir.type = 'button';
    abrir.textContent = 'Abrir';
    abrir.addEventListener('click', () => {
      el.salidaBraille.textContent = r.brailleUnicode;
      el.salidaAudio.textContent = r.audioTexto;
      el.seccionResultados.hidden = false;
      anunciar('Transcripción abierta desde el historial.');
    });

    const copiar = document.createElement('button');
    copiar.type = 'button';
    copiar.textContent = 'Copiar Braille';
    copiar.addEventListener('click', () => copiarTexto(r.brailleUnicode, 'Braille'));

    const borrar = document.createElement('button');
    borrar.type = 'button';
    borrar.textContent = 'Eliminar';
    borrar.addEventListener('click', async () => {
      await repositorio.borrar(r.id);
      await pintarHistorial();
      el.historialVacio.focus?.();
      anunciar('Entrada eliminada del historial.');
    });

    acciones.append(abrir, copiar, borrar);
    item.appendChild(acciones);
    el.listaHistorial.appendChild(item);
  }
}

async function copiarTexto(texto, etiqueta) {
  await copiar(texto, etiqueta);
}

async function onBorrarTodo() {
  const confirmado = window.confirm(
    'Se eliminarán todas las transcripciones del historial. Esta acción es irreversible. ¿Continuar?',
  );
  if (!confirmado) return;
  await repositorio.borrarTodo();
  await pintarHistorial();
  anunciar('Historial borrado por completo.');
}

async function iniciar() {
  await cargarSignografia();
  repositorio = await crearRepositorio();
  await pintarHistorial();

  el.form.addEventListener('submit', onSubmit);
  el.copiarBraille.addEventListener('click', () => copiar(el.salidaBraille.textContent, 'Braille'));
  el.copiarAudio.addEventListener('click', () => copiar(el.salidaAudio.textContent, 'Texto de audio'));
  el.borrarTodo.addEventListener('click', onBorrarTodo);

  anunciar('Listo para transcribir. Selecciona una imagen del tablero.');
}

iniciar().catch(() => {
  anunciar('No se pudo inicializar la aplicación.');
});
