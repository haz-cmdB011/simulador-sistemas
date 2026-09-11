import React, { useState, useRef, useEffect } from 'react';
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
 * A diferencia del resto de los paneles, este NO usa el efecto de vidrio
 * translúcido: su fondo es sólido a propósito. Si fuera transparente,
 * mientras el usuario elige un color el panel mostraría ese mismo color
 * "sangrando" a través de su propio fondo (porque las manchas de vidrio que
 * está editando están literalmente detrás de él), lo que hacía difícil ver
 * bien qué color se estaba escogiendo. Un panel sólido evita esa confusión.
 */
export const ThemeCustomizer = () => {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(loadTheme);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

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
    <div className="nav-menu-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="nav-menu-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title="Personalizar los colores de la interfaz y el fondo"
      >
        <Palette size={16} />
        <span>Colores</span>
      </button>

      <div className={`theme-panel ${open ? 'open' : ''}`} role="dialog" aria-hidden={!open}>
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
    </div>
  );
};

export default ThemeCustomizer;
