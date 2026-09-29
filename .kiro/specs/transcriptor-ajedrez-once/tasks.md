# Tareas — Transcriptor de diagramas de ajedrez ONCE

> No iniciar una tarea de implementación sin releer los requisitos y el diseño vinculados. Las prioridades B8, JSON validado, WCAG 2.2 AA, privacidad local y rechazo de flechas ambiguas no admiten excepciones. Las tareas se ejecutan en orden salvo indicación contraria.

- [ ] 1. Confirmar el alcance y la licencia/uso permitido del material B8 proporcionado; registrar la versión de `signografia.json` y las decisiones de producto pendientes. _R1–R7, RNF2–RNF4_
- [ ] 2. Inicializar una aplicación web offline-first y su pipeline local de validación; bloquear endpoints de análisis, telemetría y cualquier credencial o dependencia de proveedor remoto. _R2, RNF2, RNF4_
- [ ] 3. Definir el esquema ejecutable del contrato intermedio y validadores de coordenadas, enums, unicidad, límites de piezas y ambigüedad de flechas. _R3, R4, RNF3_
- [ ] 4. Crear `signografia.json` versionado y el normalizador de coordenadas/orden, con los ocho dígitos bajos B8 como única fuente de mapeo. _R4, RNF3, RNF4_
- [ ] 5. Implementar el formateador Braille B8 puro: bandos, orden, espacios, resaltados y flechas según la tabla fijada. _R4_
- [ ] 6. Implementar el formateador Audio puro: agrupación, singular/plural, coordenadas mayúsculas y conjunción final. _R5_
- [ ] 7. Integrar el runtime/modelo de visión local y el orquestador de un único reintento condicionado por error de validación. Debe funcionar sin red y no tener fallback remoto. _R2, R3, R7, RNF2_
- [ ] 8. Construir la interfaz de selección y resultado con HTML semántico, etiqueta de archivo, aviso de procesamiento local, ayuda, estado `role="log"`, progreso `aria-live="polite"` y error recuperable. _R1, R5, R7, RNF1_
- [ ] 9. Implementar botones accesibles para copiar Braille y Audio, con confirmación anunciada sin cambio de foco. _R5, R7, RNF1_
- [ ] 10. Implementar el repositorio IndexedDB y el historial `Partidas anteriores`, incluyendo abrir, copiar, borrar uno y borrar todo con confirmación. No almacenar imágenes ni transmitir registros. _R6, RNF1, RNF2_
- [ ] 11. Crear fixtures a partir de los 6 tableros B8 y 4 diagramas Audio proporcionados; verificar coincidencia exacta para entradas JSON válidas. _R4, R5, RNF3_
- [ ] 12. Añadir pruebas de errores: rango, piezas duplicadas, límites, enums, flecha ambigua, dos fallos consecutivos, runtime local y cuota de almacenamiento. _R3, R6, R7_
- [ ] 13. Verificar privacidad: ejecutar análisis sin conectividad e inspeccionar que no se realizan solicitudes ni se emiten imagen, derivados, JSON, texto o metadatos. _R2, RNF2_
- [ ] 14. Ejecutar auditoría de accesibilidad automatizada y revisión manual con teclado, NVDA, Narrador y VoiceOver; resolver los problemas antes de demo. _R1, R5–R7, RNF1_
- [ ] 15. Preparar demo del hackathon: explicar el pipeline local de dos pasos, mostrar un caso táctico con resaltado/flecha, copiar ambas salidas y navegar/eliminar el historial solo con teclado. _R1–R7_

## Puertas de salida
- No pasar de la tarea 4 a la 5 sin una prueba de que cada fila usa el carácter Unicode bajo correcto.
- No conectar una imagen al runtime antes de que la tarea 3 rechace entradas inválidas y flechas ambiguas de manera fiable.
- No habilitar persistencia antes de que los resultados hayan pasado el formateo determinista y la validación.
- No declarar preparado para demo hasta comprobar análisis sin red, fixtures B8/Audio, prueba de teclado y revisión con lector de pantalla.
