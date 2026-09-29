---
inclusion: always
---
# Estándares del Transcriptor ONCE de Ajedrez

## Prioridades innegociables
1. **B8 estricto:** el Documento técnico B8 y los ejemplos aportados son la fuente de verdad y el diferenciador frente a descriptores genéricos.
2. **JSON validado:** ninguna salida ni persistencia existe antes de superar validación estructural y semántica; solo hay un reintento de extracción.
3. **WCAG 2.2 AA:** la operación íntegra por teclado y lector de pantalla es condición de producto, no una mejora posterior.
4. **Privacidad híbrida con consentimiento:** interfaz, historial y transcripciones previas funcionan localmente y sin red. Para analizar una imagen nueva con Gemini se requiere consentimiento informado explícito previo; solo tras aceptarlo la imagen viaja a Google Gemini. La preferencia local se guarda como `consentimiento_gemini: true|false` y debe poder revocarse desde ajustes.
5. **Flechas conservadoras:** una flecha ambigua es un error recuperable; nunca se inventa un trazo, dirección o conector.

## Propósito y fuente de verdad
Este proyecto es un transcriptor especializado de diagramas de ajedrez para estudio táctico autónomo; no debe comportarse como un descriptor visual genérico. Ante contradicciones o ambigüedad, se debe solicitar una decisión o aplicar el fallback explícito, nunca inventar una posición.

## Convenciones B8 obligatorias
- Coordenadas: columnas latinas minúsculas `a`–`h`, de izquierda a derecha; filas `1`–`8`, desde la perspectiva de blancas.
- Piezas: `R`, `D`, `T`, `A`, `C`, `P`. La salida posicional no añade un marcador distinto para blancas y negras; se separa por bando.
- Dígitos bajos Unicode: `1=⠂`, `2=⠆`, `3=⠒`, `4=⠲`, `5=⠢`, `6=⠖`, `7=⠶`, `8=⠦`.
- Cada pieza se expresa como inicial, columna y dígito bajo: por ejemplo `Re⠂` o `Pa⠆`.
- Orden invariable en cada bando: `R`, `D`, `T`, `A`, `C`, `P`; dentro de tipo, columna ascendente y después fila ascendente. Las piezas se separan únicamente por un espacio.
- Los resaltados se emiten en un bloque posterior con paréntesis invertidos: `)Resaltadas en amarillo las casillas g⠒ y h⠲(`. Si hay colores, se agrupan por color en orden amarillo y rojo.
- Las flechas se emiten como coordenadas minúsculas y dígitos bajos. La salida conservadora por defecto es `origen-destino`; solo se usan conectores B8 distintos si la extracción ha clasificado el trazo con confianza.
- La salida de lector de pantalla agrupa cada bando en este orden: Rey, Dama, Torres, Alfiles, Caballos, Peones. Las casillas se escriben en mayúsculas y cada grupo usa lenguaje natural con `y` antes del último elemento.

## Datos, validación y fallos
- Gemini solo puede entregar el JSON intermedio establecido en el spec; no genera Braille ni texto Audio y ninguna transcripción se formatea antes de validar ese JSON.
- Validar coordenadas `^[a-h][1-8]$`, tipos, colores, trazos, ausencia de piezas duplicadas por casilla, máximo de 16 piezas por bando y un máximo de un rey de cada color. No se exige que la posición sea legal de torneo.
- Si falla el esquema o las invariantes, se reintenta una única vez con el error de validación. Si vuelve a fallar, no se guarda historial y se anuncia un error accesible.
- La confianza insuficiente para piezas, colores, resaltados o flechas implica el mismo error recuperable; no se debe completar con conjeturas.

## Accesibilidad no negociable
- Objetivo mínimo: WCAG 2.2 nivel AA y prueba con teclado además de NVDA, Narrador y VoiceOver.
- Usar HTML nativo primero. Todo control necesita un nombre accesible mediante `label` visible asociado o `aria-label` cuando no exista etiqueta visible; no duplicar ambos innecesariamente.
- Mantener orden de foco visible y lógico, operar toda acción con teclado, no exigir arrastrar/soltar y no depender solo de color, imagen, hover ni sonido.
- El estado de carga, éxito y progreso se anuncia con una región `role="log"` y `aria-live="polite"`; los errores bloqueantes usan una región de alerta y mantienen el foco en un punto recuperable.
- El historial es una lista semántica navegable, con botones nativos para abrir, copiar y eliminar. No usar roles ARIA que sustituyan semántica HTML suficiente.
- Antes de la primera transmisión, mostrar un diálogo accesible que diga: «Para transcribir esta imagen se enviará a Google Gemini. ¿Aceptas?». Si se rechaza, anunciar: «Transcripción cancelada. La imagen no se ha enviado.».

## Privacidad y calidad
- El flujo local no transmite información: navegación, ajustes, historial y lectura/copia de registros funcionan offline. Las imágenes no se almacenan en el historial.
- La imagen de una transcripción nueva solo puede enviarse a Gemini después de consentimiento afirmativo. La revocación elimina o cambia la preferencia a `false` e impide nuevos envíos hasta una nueva aceptación.
- `GEMINI_API_KEY` se obtiene exclusivamente de las variables de entorno del servidor; nunca aparece en HTML, JavaScript del cliente, registros, mensajes de error ni archivos versionados. `.env` debe estar en `.gitignore`; solo `.env.example` se versiona.
- Separar consentimiento, extracción Gemini, validación, formateo B8, presentación y persistencia. `signografia.json` es la única fuente de mapeos Braille y no se duplican sus valores en componentes.
- Cada cambio debe mantener trazabilidad requisito → diseño → tarea y ejecutar las validaciones definidas en el spec antes de considerarse terminado.
