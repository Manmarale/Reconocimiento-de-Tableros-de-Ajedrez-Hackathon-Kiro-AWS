---
name: transcripcion-ajedrez-b8
description: Planifica, implementa o revisa el transcriptor especializado de diagramas de ajedrez del Reto ONCE, con salida Braille Unicode B8, texto Audio, procesamiento local e interfaz accesible.
license: MIT
metadata:
  category: accessibility
  complexity: advanced
  language: es
---

# Transcripción de Ajedrez B8

## Cuándo usar esta skill
Úsala al diseñar, implementar, probar o revisar el transcriptor ONCE. No la uses como sustituto de una revisión humana de una imagen dudosa ni para inventar posiciones de ajedrez.

## Prioridades innegociables
1. B8 estricto como fuente de verdad oficial ONCE.
2. JSON validado antes de salida o persistencia, con un único reintento.
3. WCAG 2.2 AA y operación completa con teclado y lector de pantalla.
4. Modo híbrido: interfaz e historial locales; una imagen solo se envía a Gemini tras consentimiento explícito, mediante endpoint local y con la clave exclusiva del entorno del servidor.
5. Flecha ambigua igual a error recuperable, nunca a una conjetura.

## Contexto obligatorio
Lee, en este orden:
1. `.kiro/steering/accesibilidad-ajedrez-once.md`.
2. `.kiro/specs/transcriptor-ajedrez-once/requirements.md`.
3. `.kiro/specs/transcriptor-ajedrez-once/design.md`.
4. `.kiro/specs/transcriptor-ajedrez-once/tasks.md`.

Los ejemplos B8 y Audio proporcionados por la persona usuaria son fixtures de aceptación. Solo se usa su texto; no se extraen imágenes del documento de referencia para entrenar ni planificar.

## Flujo obligatorio
1. Separar extracción visual local, validación, normalización, formateo, UI e historial.
2. Hacer que el runtime local devuelva exclusivamente el contrato JSON; validar antes de cualquier texto visible o persistencia.
3. Tras un primer JSON inválido, reintentar una sola vez con la causa. Tras el segundo fallo, informar una recuperación accesible y no guardar el resultado.
4. Usar `signografia.json` como fuente única de dígitos bajos, piezas, conectores y rótulos.
5. Formatear Braille con tipos `R,D,T,A,C,P`, orden por columna/fila y espacios simples; no usar comas entre piezas.
6. Formatear Audio en español, con casillas en mayúsculas, agrupación y concordancia natural.
7. Ejecutar la inferencia sin solicitudes de red; no enviar ni persistir imágenes, píxeles derivados, JSON no validado o respuestas crudas del modelo.
8. Persistir solo transcripciones válidas y metadatos locales mínimos; nunca imágenes.
9. Validar teclado, foco, nombres accesibles, anuncios y errores antes de cerrar una tarea.

## Reglas críticas de calidad
- Tratar `a1`–`h8` como única geometría válida, con filas desde blancas.
- Rechazar piezas superpuestas, más de 16 piezas por bando, más de un rey por color, casillas o enums inválidos.
- Emitir resaltados como texto además de cualquier color visual.
- Aplicar la política determinista de flechas del diseño; una flecha ambigua es un fallo de extracción, no una excusa para adivinar.
- Preferir `label` visible frente a ARIA; usar `aria-label` solo cuando el control no disponga de texto visible suficiente.
- Informar progreso con `role="log"` y `aria-live="polite"`; errores bloqueantes con alerta y vía de recuperación.

## Lista de revisión antes de entregar
- [ ] El JSON intermedio cumple el esquema y todas las invariantes.
- [ ] El Braille usa los ocho caracteres Unicode bajos correctos y el orden B8.
- [ ] Los fixtures de los seis tableros Braille y cuatro diagramas Audio coinciden exactamente.
- [ ] Las transcripciones inválidas no llegan al historial.
- [ ] El flujo completo se opera con teclado y los mensajes son inteligibles mediante lector de pantalla.
- [ ] El análisis funciona sin conectividad y la inspección de red no muestra salida de imagen, JSON, texto ni metadatos.
