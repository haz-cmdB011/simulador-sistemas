import React, { useEffect, useRef, useState } from 'react';

// Genera una fila de celdas para la cuadrícula del gato (pixel art) a partir
// de rangos de columnas "encendidas", en vez de escribir el patrón a mano
// como una cadena de texto larga y propensa a errores de conteo.
function fila(ancho, rangos, extras = {}) {
  const celdas = new Array(ancho).fill('.');
  rangos.forEach(([desde, hasta]) => {
    for (let c = desde; c <= hasta; c++) celdas[c] = 'F';
  });
  Object.entries(extras).forEach(([col, tipo]) => {
    celdas[Number(col)] = tipo;
  });
  return celdas;
}

const ANCHO_CABEZA = 14;
const FILAS_CABEZA = [
  fila(ANCHO_CABEZA, [[0, 13]]),
  fila(ANCHO_CABEZA, [[0, 13]]),
  fila(ANCHO_CABEZA, [[0, 13]], { 3: 'E', 10: 'E' }),
  fila(ANCHO_CABEZA, [[0, 13]], { 6: 'N', 7: 'N' }),
  fila(ANCHO_CABEZA, [[0, 13]]),
  fila(ANCHO_CABEZA, [[1, 12]]),
  fila(ANCHO_CABEZA, [[2, 11]])
];

// Cada oreja es un pequeño triángulo escalonado (estilo pixel art clásico):
// una celda arriba, dos en medio, tres abajo.
const FILAS_OREJA = [
  fila(3, [[1, 1]]),
  fila(3, [[0, 1]]),
  fila(3, [[0, 2]])
];

const TAM_CELDA = 6; // px por "pixel"

const colorCelda = (tipo) => {
  switch (tipo) {
    case 'F':
      return 'var(--pixel-cat-fur, #f2a65a)';
    case 'E':
      return '#241a12';
    case 'N':
      return '#e07b93';
    default:
      return 'transparent';
  }
};

const Cuadricula = ({ filas, ancho, className }) => (
  <div
    className={className}
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${ancho}, ${TAM_CELDA}px)`,
      gridTemplateRows: `repeat(${filas.length}, ${TAM_CELDA}px)`
    }}
  >
    {filas.flatMap((f, r) =>
      f.map((tipo, c) => (
        <span
          key={`${r}-${c}`}
          style={{
            width: TAM_CELDA,
            height: TAM_CELDA,
            background: colorCelda(tipo),
            boxShadow: tipo !== '.' ? 'inset 0 0 0 0.5px rgba(0,0,0,0.06)' : 'none'
          }}
        />
      ))
    )}
  </div>
);

const aleatorioEntre = (min, max) => min + Math.random() * (max - min);

/**
 * Easter egg: un gatito en pixel art que de vez en cuando se asoma por el
 * borde inferior de la ventana, mueve las orejas un par de veces y se
 * vuelve a esconder. Puramente decorativo — pointer-events: none en todo
 * momento, así nunca interfiere con clics ni con el resto de la interfaz.
 */
export const PixelCatEasterEgg = () => {
  const [visible, setVisible] = useState(false);
  const [saludando, setSaludando] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    let cancelado = false;

    const asomarse = () => {
      if (cancelado) return;
      setVisible(true);
      // Un instante después de asomarse, empieza a mover las orejas.
      const t1 = setTimeout(() => !cancelado && setSaludando(true), 350);
      // Se queda un rato visible con las orejas quietas...
      const t2 = setTimeout(() => !cancelado && setSaludando(false), 2000);
      // ...y luego se vuelve a esconder.
      const t3 = setTimeout(() => {
        if (cancelado) return;
        setVisible(false);
        programarSiguiente();
      }, 2600);
      timeoutRef.current = [t1, t2, t3];
    };

    const programarSiguiente = () => {
      // Aparece cada 50-110 segundos, en un momento impredecible — así se
      // siente como un easter egg y no como un elemento fijo de la UI.
      const espera = aleatorioEntre(50000, 110000);
      timeoutRef.current = setTimeout(asomarse, espera);
    };

    programarSiguiente();

    return () => {
      cancelado = true;
      const actual = timeoutRef.current;
      if (Array.isArray(actual)) actual.forEach(clearTimeout);
      else clearTimeout(actual);
    };
  }, []);

  return (
    <div
      className={`pixel-cat ${visible ? 'pixel-cat-visible' : ''}`}
      aria-hidden="true"
    >
      <div className="pixel-cat-ears">
        <Cuadricula
          filas={FILAS_OREJA}
          ancho={3}
          className={`pixel-cat-ear pixel-cat-ear-left ${saludando ? 'pixel-cat-ear-wiggle' : ''}`}
        />
        <Cuadricula
          filas={FILAS_OREJA}
          ancho={3}
          className={`pixel-cat-ear pixel-cat-ear-right ${saludando ? 'pixel-cat-ear-wiggle' : ''}`}
        />
      </div>
      <Cuadricula filas={FILAS_CABEZA} ancho={ANCHO_CABEZA} className="pixel-cat-head" />
    </div>
  );
};

export default PixelCatEasterEgg;
