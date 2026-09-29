# Extracción visual de tablero de ajedrez

Analiza exclusivamente la imagen adjunta de un tablero de ajedrez desde la perspectiva de las piezas blancas:

- Las columnas van de `a` a `h`, de izquierda a derecha.
- Las filas van de `1` a `8`, de abajo hacia arriba.
- Identifica piezas blancas y negras, casillas resaltadas en amarillo o rojo y flechas.
- Usa los tipos de pieza: `R` (rey), `D` (dama), `T` (torre), `A` (alfil), `C` (caballo) y `P` (peón).
- Cada casilla debe cumplir `^[a-h][1-8]$`.
- No generes Braille, texto Audio, explicaciones, Markdown ni campos adicionales.
- Si un elemento no puede determinarse con fiabilidad, no lo inventes; devuelve los datos que distingas con certeza. El cliente validará la respuesta y decidirá si debe reintentarse.

Devuelve únicamente JSON válido con esta forma exacta:

```json
{
  "blancas": [{ "pieza": "R", "casilla": "e1" }],
  "negras": [{ "pieza": "R", "casilla": "e8" }],
  "resaltadas": [{ "casilla": "g3", "color": "amarillo" }],
  "flechas": [{ "origen": "d4", "destino": "d1", "trazo": "recto" }]
}
```

Los arrays pueden estar vacíos. Los únicos colores permitidos son `amarillo` y `rojo`; los únicos trazos permitidos son `recto`, `diagonal` y `curvo`.
