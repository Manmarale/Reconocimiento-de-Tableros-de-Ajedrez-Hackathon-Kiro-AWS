# Diseño — Transcriptor de diagramas de ajedrez ONCE

## Decisión Sprint 1.5 — flujo híbrido
Esta decisión sustituye el runtime de visión local de la primera planificación. El navegador conserva interfaz, consentimiento e historial locales; una imagen nueva solo se envía tras consentimiento afirmativo a `POST /api/transcribe` del servidor local. El servidor carga `GEMINI_API_KEY` desde el entorno, llama a `gemini-3.5-flash-lite` y devuelve exclusivamente la extracción JSON. La clave no se expone al navegador. El cliente valida la extracción, reintenta una vez y formatea localmente el Braille B8 y Audio.

## Prioridades de arquitectura
El diseño prioriza, en este orden no negociable: fidelidad B8, validación antes de salida, accesibilidad WCAG 2.2 AA, privacidad híbrida con consentimiento y rechazo de flechas ambiguas. El objetivo no es maximizar transcripciones: es producir únicamente transcripciones fiables y accesibles.

## Decisiones arquitectónicas

| Decisión | Elección | Motivo |
|---|---|---|
| Aplicación | Web semántica minimalista | Reduce fricción y favorece tecnología asistiva nativa. |
| Persistencia | IndexedDB, con repositorio intercambiable | Mantiene historial estructurado local sin almacenar imágenes. |
| Extracción | Runtime y modelo de visión locales, ejecutados en navegador/dispositivo | Impide que diagramas, JSON y transcripciones salgan del dispositivo. |
| Conectividad | Ninguna solicitud de red durante análisis; funcionamiento offline tras instalar los recursos locales | Hace comprobable la privacidad del flujo. |
| Formateo | Módulo determinista, no generativo, alimentado por `signografia.json` | Evita variaciones y hace auditables las reglas B8. |
| Reintento | Una única repetición tras error de esquema | Recupera respuestas malformadas sin bucles ni invención de datos. |
| Estado accesible | HTML nativo + regiones vivas | Compatibilidad con NVDA, Narrador y VoiceOver. |

## Componentes y flujo

1. **Entrada accesible:** etiqueta visible, restricciones de archivo, aviso de procesamiento local y ayuda; selección mediante control de archivo nativo. La previsualización, si existe, es complementaria y nunca la única fuente de estado.
2. **Orquestador local:** crea el estado de trabajo, informa a la región de progreso y solicita al runtime local la extracción. No realiza solicitudes de red.
3. **Runtime de visión local:** carga recursos ya instalados/locales y analiza en el dispositivo: escanea columnas a–h y filas 1–8 desde blancas, clasifica piezas, resaltados y flechas, y devuelve exclusivamente JSON. No realiza ni delega el formateo B8.
4. **Validador:** analiza forma y reglas de negocio. Entrega un error tipado al orquestador. En el primer fallo, el orquestador reintenta con el detalle mínimo del error; en el segundo, termina con fallo accesible.
5. **Normalizador y ordenación:** convierte casillas a claves comparables y ordena las piezas por tipo, columna y fila. Mantiene bando separado.
6. **Formatters:** el formateador Braille consulta `signografia.json`; el formateador Audio agrupa y pluraliza. Ambos reciben exactamente el mismo objeto validado e inmutable.
7. **Presentación de resultados:** usa títulos y regiones de lectura estáticas; copia mediante botones nativos con estado anunciado. Los resultados no necesitan `aria-live` si ya se ha anunciado su disponibilidad.
8. **Repositorio de historial:** persiste únicamente el registro válido y expone operaciones de listar, abrir, borrar una entrada y borrar todo.

## Modelo de datos

### Entidades persistidas
- **Transcripción:** `id`, `creadoEn`, `fuente`, `nombreOpcional`, `tableroValidado`, `brailleUnicode`, `audioTexto`, `versionSignografia`.
- **Tablero:** piezas, resaltadas y flechas del contrato de R3.
- **No se persiste ni transmite:** archivo original, binario/píxeles derivados, JSON no validado, respuesta cruda del modelo, texto de salida, claves, tokens, URL remota o telemetría.

### Reglas de validación
| Elemento | Regla |
|---|---|
| Casilla | Coincide exactamente con `^[a-h][1-8]$`. |
| Pieza | Tipo en `R,D,A,C,T,P`; color `blanca` o `negra`; una sola pieza en cada casilla global. |
| Conteo | Hasta 16 piezas por color y hasta un rey por color. |
| Resaltado | Color amarillo o rojo; no se duplica la misma pareja casilla-color. |
| Flecha | Origen y destino válidos y distintos; trazo recto, diagonal o curvo. La ambigüedad de trazo se informa como fallo de extracción. |
| Metadatos | Fuente usuario o demo; timestamp ISO 8601 válido generado por la aplicación. |

## `signografia.json`
El fichero externo debe contener, como mínimo, el mapa de filas `1…8` a `⠂ ⠆ ⠒ ⠲ ⠢ ⠖ ⠶ ⠦`, iniciales de pieza, orden de tipos, rótulos de color, conectores de flecha y frases de salida. El código de interfaz no contendrá equivalencias duplicadas. Versionar el fichero y persistir su versión permite reconstruir una transcripción histórica.

## Política de flechas
El contrato dado contiene `trazo`, no una dirección detallada. Para que el resultado sea determinista se establece una tabla de producto: recto → `-`; diagonal → `⠪⠒`; curvo → `⠒⠕`. Si la señal visual no permite determinar el trazo con confianza, se considera extracción fallida; no se usa una flecha arbitraria. Si una revisión posterior de B8 exige distinguir más direcciones, se añadirá un campo versionado `conector` o `direccion` sin romper registros existentes.

## Diseño de interacción accesible
- El flujo principal usa `main`, encabezados jerárquicos, `form`, `label`, `button`, listas y `section` con nombres accesibles.
- La región de actividad usa `role="log"` y `aria-live="polite"`, con mensajes breves: archivo seleccionado, analizando localmente, reintentando, resultados listos, copiado y guardado.
- Los errores bloqueantes usan `role="alert"`; el foco va al resumen de error solo cuando la tarea finaliza con error, y la ayuda se asocia al campo de archivo.
- Cada control recibe nombre accesible. La etiqueta visible tiene preferencia; `aria-label` se reserva para controles con icono o sin texto visible.
- El historial es un `section` con lista ordenada o no ordenada; cada registro incorpora fecha, resumen, abrir, copiar y eliminar. El foco tras borrar se conserva en el control equivalente siguiente o vuelve al título del historial.
- Contraste, foco, tamaño de objetivo, ausencia de límite de tiempo y reflujo se revisan contra WCAG 2.2 AA. Ningún dato depende del color; los resaltados se nombran también en texto.

## Fallos y límites
- **Imagen no interpretable o flecha ambigua:** mensaje acordado, sin crear resultado ni historial.
- **JSON inválido:** un reintento; después, error de validación con opción de elegir otro archivo.
- **Runtime local no disponible o sin recursos:** error recuperable que mantiene el formulario listo e indica cómo instalar/cargar el recurso local; nunca hace fallback remoto.
- **IndexedDB no disponible/cuota:** informar que no se pudo guardar, preservando la transcripción actual para copiar.
- No se implementa telemetría en esta versión. Cualquier decisión futura requiere que no transmita diagramas, derivados, JSON ni transcripciones y una revisión de privacidad explícita.

## Estrategia de pruebas
1. Pruebas unitarias puras: schema/invariantes, orden, dígitos bajos, composición de resaltados, conectores y pluralización Audio.
2. Pruebas de contrato: JSON correcto, primer fallo + reintento correcto, segundo fallo, flecha ambigua y rechazo de persistencia.
3. Pruebas de regresión: los 6 ejemplos Braille y 4 ejemplos Audio aportados como fixtures de texto.
4. Pruebas de privacidad: navegador sin conectividad durante el análisis e inspección de red que demuestre ausencia de solicitudes y de salida de imagen, JSON o texto.
5. Pruebas de interfaz: teclado completo, foco tras borrar, anuncio de estados, carga y errores.
6. Auditoría: automatizada para problemas detectables y revisión manual con NVDA, Narrador y VoiceOver. La revisión humana es obligatoria para anuncios de región viva.
