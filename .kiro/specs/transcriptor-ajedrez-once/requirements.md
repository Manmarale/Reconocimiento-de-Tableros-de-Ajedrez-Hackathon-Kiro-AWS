# Requisitos — Transcriptor de diagramas de ajedrez ONCE

## Decisión Sprint 1.5 — privacidad híbrida
Esta decisión sustituye las referencias previas a extracción enteramente local: la interfaz, ajustes, historial, lectura y copia de transcripciones funcionan offline y no transmiten datos. Para transcribir una imagen nueva se solicita primero el consentimiento accesible «Para transcribir esta imagen se enviará a Google Gemini. ¿Aceptas?». Solo una aceptación afirmativa, registrada como `consentimiento_gemini: true`, permite enviar la imagen al endpoint local de la aplicación y de ahí a Gemini. El rechazo anuncia «Transcripción cancelada. La imagen no se ha enviado.». La preferencia se puede revocar y la clave permanece exclusivamente en `GEMINI_API_KEY` del entorno del servidor.

## Principios rectores
El producto solo es válido si cumple simultáneamente: B8 estricto como estándar oficial ONCE; JSON intermedio validado con un único reintento; WCAG 2.2 AA; privacidad híbrida con consentimiento; y fallo recuperable ante flechas ambiguas. Ningún principio puede sacrificarse para obtener una transcripción aparente.

## Alcance
Aplicación web minimalista que recibe una imagen de un tablero de ajedrez y, sin transmitirla fuera del dispositivo, genera una adaptación Braille Unicode B8 compatible con Ebrai y una adaptación textual para lector de pantalla. Incluye historial local accesible. El material B8 y los seis tableros Braille y cuatro diagramas Audio aportados constituyen el oráculo de aceptación.

## Fuera de alcance inicial
- Jugar partidas, validar jaque o legalidad ajedrecística completa.
- Editar manualmente el tablero, OCR generalista o descripción de imágenes no ajedrecísticas.
- Sincronización cloud, cuentas de usuario, APIs de visión remotas, telemetría o cualquier transmisión de imagen, JSON o transcripción fuera del dispositivo.

## Actores y recorridos
- **Estudiante ciego:** selecciona una imagen con teclado, conoce el progreso local, obtiene dos transcripciones, copia una salida y revisa o borra transcripciones anteriores sin usar ratón.
- **Persona evaluadora:** usa los ejemplos B8 y Audio para comprobar que el resultado, la privacidad y la accesibilidad son reproducibles.

## Requisitos funcionales

### R1. Entrada de imagen accesible
- Cuando la persona usuaria llegue al control de archivo, el sistema debe exponer una etiqueta que explique formatos aceptados, finalidad y que el análisis es local.
- Cuando seleccione una imagen válida, el sistema debe anunciar nombre, inicio del análisis y progreso sin mover el foco de forma inesperada.
- Si la imagen no puede procesarse, el sistema debe conservar la selección o permitir una sustitución simple y explicar el siguiente paso.

### R2. Extracción visual local y estructurada
- Cuando se analice una imagen, un motor de visión que se ejecuta en el dispositivo debe identificar la cuadrícula desde blancas, las piezas, resaltados rojo/amarillo y flechas, y responder solamente con el contrato JSON de R3.
- Durante la extracción, el sistema no debe emitir solicitudes de red ni transmitir la imagen, píxeles derivados, JSON, transcripción o metadatos.
- Si faltan señales visuales suficientes o se detecta una cuadrícula ambigua, el sistema debe informar que no se puede interpretar el diagrama, sin fabricar datos.

### R3. Contrato JSON intermedio y validación
La forma canónica es:

```json
{
  "tablero": {
    "piezas": [{"tipo": "R|D|A|C|T|P", "color": "blanca|negra", "casilla": "e1"}],
    "resaltadas": [{"casilla": "g7", "color": "amarillo|rojo"}],
    "flechas": [{"origen": "d1", "destino": "d5", "trazo": "recto|diagonal|curvo"}]
  },
  "metadatos": {"fuente": "usuario|demo", "timestamp": "ISO8601"}
}
```

- Antes de formatear, el sistema debe validar esquema, coordenadas de `a1` a `h8`, enums, unicidad de casilla de pieza, máximo de 16 piezas por bando y máximo de un rey por color.
- Las listas vacías son válidas; no se presupone una posición inicial completa ni legalidad de torneo.
- Si la primera validación falla, el sistema debe reintentar una vez la extracción incluyendo el motivo de rechazo. Si el segundo resultado falla, debe emitir un error accesible y no persistir nada.

### R4. Adaptación Braille B8
- Cuando haya JSON válido, el formateador debe usar exclusivamente los datos de `signografia.json` para convertir filas a dígitos bajos Unicode.
- Debe ordenar piezas y producir los bloques `Blancas:` y `Negras:` según B8, sin comas ni punto y coma entre piezas.
- Debe emitir resaltados después de ambos bandos, agrupados por color. Si no hay resaltados, omite el bloque.
- Debe emitir las flechas después de resaltados. Para evitar ambigüedad se fija: `recto` usa `-`, `diagonal` usa `⠪⠒` y `curvo` usa `⠒⠕`; ante clasificación visual no fiable, la extracción debe fallar en vez de elegir un conector.

### R5. Adaptación Audio
- Cuando haya JSON válido, el sistema debe crear texto natural en español por bando y en el orden Rey, Dama, Torres, Alfiles, Caballos y Peones.
- Las casillas deben ir en mayúsculas, los plurales deben concordar y la enumeración debe usar `y` antes del último elemento.
- La página debe permitir copiar por separado el Braille y el texto de audio, con confirmación no intrusiva para lector de pantalla.

### R6. Historial local accesible
- Tras una transcripción válida, el sistema debe guardar localmente un registro con identificador, fecha/hora, fuente, nombre opcional, JSON validado y ambas salidas; las imágenes quedan excluidas.
- La sección debe anunciarse como `Partidas anteriores`, ser alcanzable por teclado, presentar fecha y resumen de cada entrada y permitir abrir, copiar o eliminar cada registro.
- Debe existir una acción de borrado total con confirmación explícita, descripción de irreversibilidad y resultado anunciado.

### R7. Estados y errores
- Mientras procese, el sistema debe usar una región de estado `role="log"` con `aria-live="polite"` para progreso y éxito.
- Los errores que impidan continuar deben ser perceptibles sin color, llegar a una región de alerta y ofrecer acción de recuperación.
- Un fallo del runtime local, del esquema, de validación o de almacenamiento debe distinguirse en el mensaje de ayuda sin revelar datos locales.

## Requisitos no funcionales
- **RNF1 Accesibilidad:** cumplimiento verificable WCAG 2.2 AA; prueba manual con teclado, NVDA, Narrador y VoiceOver.
- **RNF2 Privacidad local:** la imagen, sus derivados, el JSON y transcripciones nunca abandonan el dispositivo. El flujo de análisis no requiere claves de proveedor, servidor remoto ni conectividad de red.
- **RNF3 Determinismo:** el mismo JSON validado genera siempre la misma salida B8 y Audio.
- **RNF4 Mantenibilidad:** reglas B8 externalizadas en `signografia.json`; capas de extracción local, validación, formateo, UI e historial separadas.

## Criterios de aceptación de conjunto
1. Los seis ejemplos Braille proporcionados se representan exactamente con la forma B8 acordada, incluidos dígitos bajos, orden y bloques de resaltado/flechas cuando aplique.
2. Los cuatro ejemplos Audio proporcionados se representan con sus agrupaciones y coordenadas en mayúsculas correctas.
3. Una respuesta con coordenada fuera de rango, pieza repetida, decimoséptima pieza, enum inválido o flecha ambigua se rechaza antes de formatar; solo ocurre un reintento de extracción.
4. Se puede completar selección, transcripción, copia, navegación de historial y borrado con teclado y con anuncios comprensibles en lector de pantalla.
5. Una transcripción inválida nunca aparece como entrada de historial.
6. Con el navegador sin conectividad durante el análisis, la transcripción local y el historial siguen funcionando y la inspección de red no muestra salida de imagen, JSON, texto ni metadatos.
