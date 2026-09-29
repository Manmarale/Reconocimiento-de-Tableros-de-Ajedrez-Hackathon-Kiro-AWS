"""Genera una imagen PNG de un diagrama de ajedrez de prueba.

Posición: Rey blanco e1, Dama blanca d1, Rey negro e8, Torre negra a5.
Resaltada en amarillo g3. Perspectiva de blancas (fila 1 abajo).
"""

from PIL import Image, ImageDraw, ImageFont

CASILLA = 80
MARGEN = 40
TABLERO = CASILLA * 8
ANCHO = TABLERO + MARGEN * 2
ALTO = TABLERO + MARGEN * 2

CLARO = (240, 217, 181)
OSCURO = (181, 136, 99)
AMARILLO = (240, 230, 90)

# Piezas: (columna 0-7, fila 1-8, símbolo, es_blanca)
import sys

if len(sys.argv) > 1 and sys.argv[1] == "2":
    # Segundo diagrama: posición distinta
    PIEZAS = [
        (6, 1, "\u2654", True),   # Rey blanco g1
        (5, 3, "\u2658", True),   # Caballo blanco f3
        (6, 8, "\u265A", False),  # Rey negro g8
        (2, 7, "\u265F", False),  # Peón negro c7
        (4, 7, "\u265F", False),  # Peón negro e7
    ]
    RESALTADAS = []
    SALIDA = "scripts/diagrama_prueba2.png"
else:
    PIEZAS = [
        (4, 1, "\u2654", True),   # Rey blanco e1
        (3, 1, "\u2655", True),   # Dama blanca d1
        (4, 8, "\u265A", False),  # Rey negro e8
        (0, 5, "\u265C", False),  # Torre negra a5
    ]
    RESALTADAS = [(6, 3)]  # g3
    SALIDA = "scripts/diagrama_prueba.png"

def fuente(tam):
    for ruta in [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSerif.ttf",
        "/usr/share/fonts/truetype/noto/NotoSansSymbols2-Regular.ttf",
    ]:
        try:
            return ImageFont.truetype(ruta, tam)
        except OSError:
            continue
    return ImageFont.load_default()

def px(col, fila):
    # fila 1 abajo (perspectiva de blancas)
    x = MARGEN + col * CASILLA
    y = MARGEN + (8 - fila) * CASILLA
    return x, y

def main():
    img = Image.new("RGB", (ANCHO, ALTO), "white")
    d = ImageDraw.Draw(img)
    f_pieza = fuente(60)
    f_rotulo = fuente(24)

    # Casillas
    for fila in range(1, 9):
        for col in range(8):
            x, y = px(col, fila)
            claro = (col + fila) % 2 == 0
            color = CLARO if claro else OSCURO
            if (col, fila) in RESALTADAS:
                color = AMARILLO
            d.rectangle([x, y, x + CASILLA, y + CASILLA], fill=color)

    # Rótulos columnas a-h y filas 1-8
    for col in range(8):
        x, _ = px(col, 1)
        d.text((x + CASILLA / 2 - 6, ALTO - MARGEN + 6), chr(ord("a") + col), fill="black", font=f_rotulo)
    for fila in range(1, 9):
        _, y = px(0, fila)
        d.text((MARGEN - 24, y + CASILLA / 2 - 12), str(fila), fill="black", font=f_rotulo)

    # Piezas
    for col, fila, simbolo, blanca in PIEZAS:
        x, y = px(col, fila)
        color = "white" if blanca else "black"
        borde = "black" if blanca else "white"
        cx, cy = x + CASILLA / 2, y + CASILLA / 2
        # Borde para contraste
        for dx, dy in [(-2, 0), (2, 0), (0, -2), (0, 2)]:
            d.text((cx + dx, cy + dy), simbolo, fill=borde, font=f_pieza, anchor="mm")
        d.text((cx, cy), simbolo, fill=color, font=f_pieza, anchor="mm")

    img.save(SALIDA)
    print(f"Imagen guardada en {SALIDA}")

if __name__ == "__main__":
    main()
