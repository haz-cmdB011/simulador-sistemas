import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Palette, RotateCcw, Check, X } from 'lucide-react';
import { DEFAULT_THEME, THEME_PRESETS, applyTheme, loadTheme, saveTheme } from '../theme';

const INTERFACE_FIELDS = [
  { key: 'primary', label: 'Principal' },
  { key: 'secondary', label: 'Secundario' },
  { key: 'accent', label: 'Éxito' }
];

const BACKGROUND_FIELDS = [
  { key: 'blob1', label: 'Fondo 1' },
  { key: 'blob2', label: 'Fondo 2' },
  { key: 'blob3', label: 'Fondo 3' },
  { key: 'blob4', label: 'Fondo 4' },
  { key: 'blob5', label: 'Fondo 5' }
];

const ALL_FIELDS = [...INTERFACE_FIELDS, ...BACKGROUND_FIELDS];

/**
 * Panel de personalización de color. Deja elegir una paleta prediseñada de
 * un clic o ajustar cada color a mano (los colores de botones/acentos y los
 * 5 tonos que forman las manchas de color detrás del vidrio), en vez de
 * quedarse fijo con la paleta azul/morada de fábrica. El cambio se aplica
 * al instante sobre toda la app y se recuerda entre sesiones en este
 * navegador.
 *
 * El panel (igual que el menú de navegación) se renderiza con un portal
 * directo a <body>, junto con su telón, y su posición se calcula a mano con
 * getBoundingClientRect() sobre el botón que lo abre. Es necesario porque el
 * botón vive dentro de una tarjeta de vidrio (glass-card) que usa
 * backdrop-filter, y backdrop-filter crea su propio "contexto de
 * apilamiento": cualquier overlay que se quede adentro, aunque tenga
 * position:fixed y un z-index alto, queda atrapado ahí y una tarjeta hermana
 * que aparece después en la página (el simulador, por ejemplo) puede
 * pintarse ENCIMA de él. Sacándolo por portal, el panel vive directamente
 * bajo <body> y ya no compite por capas ni se mezcla visualmente con nada
 * de atrás — y por lo tanto tampoco deja pasar clics hacia lo que hay debajo.
 *
 * Además, a propósito, el panel en sí es sólido (nada de vidrio
 * translúcido): si fuera transparente, mientras el usuario elige un color
 * vería ese mismo color asomándose por detrás del panel, porque las manchas
 * que está editando están justo ahí.
 */
export const ThemeCustomizer = () => {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(loadTheme);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const triggerRef = useRef(null);

  const computeCoords = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({
      top: rect.bottom + 8,
      right: Math.max(16, window.innerWidth - rect.right)
    });
  }, []);

  const toggleOpen = () => {
    if (!open) computeCoords();
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    // Si la página se desplaza o cambia de tamaño mientras está abierto, el
    // panel quedaría apuntando a una posición vieja — más simple y
    // predecible cerrarlo que intentar perseguir al botón en tiempo real.
    const closeOnMove = () => setOpen(false);
    const handleEscape = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('scroll', closeOnMove, true);
    window.addEventListener('resize', closeOnMove);
    document.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('scroll', closeOnMove, true);
      window.removeEventListener('resize', closeOnMove);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const updateTheme = (next) => {
    setTheme(next);
    applyTheme(next);
    saveTheme(next);
  };

  const handleFieldChange = (key, value) => {
    updateTheme({ ...theme, [key]: value });
  };

  const applyPreset = (preset) => {
    const { id, label, ...colors } = preset;
    updateTheme(colors);
  };

  const resetToDefault = () => {
    updateTheme(DEFAULT_THEME);
  };

  return (
    <div className="nav-menu-wrapper">
      <button
        type="button"
        ref={triggerRef}
        className="nav-menu-trigger"
        onClick={toggleOpen}
        aria-expanded={open}
        title="Personalizar los colores de la interfaz y el fondo"
      >
        <Palette size={16} />
        <span>Colores</span>
      </button>

      {createPortal(
        <>
          {/* Telón: separa visualmente el panel del resto de la página y
              asegura que un clic afuera cierre el panel en vez de activar lo
              que está detrás. */}
          <div
            className={`ui-backdrop ${open ? 'open' : ''}`}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div
            className={`theme-panel ${open ? 'open' : ''}`}
            role="dialog"
            aria-hidden={!open}
            style={{ top: coords.top, right: coords.right }}
          >
            <div className="theme-panel-header">
              <h4>Personalizar apariencia</h4>
              <button
                type="button"
                className="theme-reset-btn"
                onClick={resetToDefault}
                title="Volver a los colores de fábrica"
              >
                <RotateCcw size={13} />
                <span>Restablecer</span>
              </button>
            </div>

            <p className="theme-panel-hint">
              Elige una paleta lista o ajusta cada color abajo. Los cambios se ven al instante.
            </p>

            <div className="theme-presets-row">
              {THEME_PRESETS.map((preset) => {
                const isActive = ALL_FIELDS.every((f) => theme[f.key] === preset[f.key]);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={`theme-preset-swatch ${isActive ? 'active' : ''}`}
                    title={preset.label}
                    onClick={() => applyPreset(preset)}
                    style={{
                      background: `linear-gradient(135deg, ${preset.blob1} 0%, ${preset.blob2} 45%, ${preset.blob4} 100%)`
                    }}
                  >
                    {isActive && <Check size={14} color="#fff" />}
                  </button>
                );
              })}
            </div>
            <p className="theme-section-caption">Paletas rápidas</p>

            <p className="theme-section-caption theme-section-caption-spaced">Colores de la interfaz</p>
            <div className="theme-fields-grid">
              {INTERFACE_FIELDS.map((field) => (
                <label key={field.key} className="theme-field" title={theme[field.key]}>
                  <span className="theme-field-swatch" style={{ background: theme[field.key] }}>
                    <input
                      type="color"
                      value={theme[field.key]}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      aria-label={field.label}
                    />
                  </span>
                  <span className="theme-field-label">{field.label}</span>
                </label>
              ))}
            </div>

            <p className="theme-section-caption theme-section-caption-spaced">Manchas de color del fondo</p>
            <div className="theme-fields-grid">
              {BACKGROUND_FIELDS.map((field) => (
                <label key={field.key} className="theme-field" title={theme[field.key]}>
                  <span className="theme-field-swatch" style={{ background: theme[field.key] }}>
                    <input
                      type="color"
                      value={theme[field.key]}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      aria-label={field.label}
                    />
                  </span>
                  <span className="theme-field-label">{field.label}</span>
                </label>
              ))}
            </div>

            <button type="button" className="theme-done-btn" onClick={() => setOpen(false)}>
              <X size={14} />
              <span>Listo</span>
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default ThemeCustomizer;
