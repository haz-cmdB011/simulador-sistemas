import React, { useState, useRef, useEffect } from 'react';
import { Palette, RotateCcw, Check } from 'lucide-react';
import { DEFAULT_THEME, THEME_PRESETS, applyTheme, loadTheme, saveTheme } from '../theme';

const COLOR_FIELDS = [
  { key: 'primary', label: 'Color principal' },
  { key: 'secondary', label: 'Color secundario' },
  { key: 'accent', label: 'Acento (éxito)' },
  { key: 'blob1', label: 'Vidrio 1' },
  { key: 'blob2', label: 'Vidrio 2' },
  { key: 'blob3', label: 'Vidrio 3' },
  { key: 'blob4', label: 'Vidrio 4' },
  { key: 'blob5', label: 'Vidrio 5' }
];

/**
 * Panel de personalización de color. Deja elegir una paleta prediseñada de
 * un clic o ajustar cada color a mano (el acento de la interfaz y los 5
 * tonos que forman las manchas de color detrás del vidrio), en vez de
 * quedarse fijo con la paleta azul/morada de fábrica. El cambio se aplica
 * al instante sobre toda la app (son variables CSS) y se recuerda entre
 * sesiones en este navegador.
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
        title="Personalizar colores"
      >
        <Palette size={16} />
        <span>Colores</span>
      </button>

      <div className={`theme-panel ${open ? 'open' : ''}`} role="dialog" aria-hidden={!open}>
        <div className="theme-panel-header">
          <h4>Personalizar apariencia</h4>
          <button type="button" className="theme-reset-btn" onClick={resetToDefault} title="Restaurar colores de fábrica">
            <RotateCcw size={13} />
            <span>Restablecer</span>
          </button>
        </div>

        <div className="theme-presets-row">
          {THEME_PRESETS.map((preset) => {
            const isActive = COLOR_FIELDS.every((f) => theme[f.key] === preset[f.key]);
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
        <p className="theme-presets-caption">Paletas rápidas</p>

        <div className="theme-fields-grid">
          {COLOR_FIELDS.map((field) => (
            <label key={field.key} className="theme-field">
              <span
                className="theme-field-swatch"
                style={{ background: theme[field.key] }}
              >
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
      </div>
    </div>
  );
};

export default ThemeCustomizer;
