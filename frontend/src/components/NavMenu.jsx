import React, { useState, useRef, useEffect } from 'react';
import { Menu, ChevronDown } from 'lucide-react';

/**
 * Menú desplegable de navegación. Recibe una lista de secciones disponibles
 * para el rol del usuario actual y muestra solo una a la vez (la que esté
 * activa), en vez de tener todos los paneles apilados uno debajo del otro en
 * la misma pantalla. Así cada tipo de usuario ve nada más las funciones que
 * le corresponden, sin saturar la pantalla con información que no necesita
 * en ese momento.
 *
 * @param {{ id: string, label: string, icon: React.ComponentType, description?: string }[]} items
 * @param {string} activeId
 * @param {(id: string) => void} onSelect
 */
export const NavMenu = ({ items, activeId, onSelect }) => {
  const [open, setOpen] = useState(false);
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

  const activeItem = items.find((i) => i.id === activeId) || items[0];

  return (
    <div className="nav-menu-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="nav-menu-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <Menu size={16} />
        <span>{activeItem ? activeItem.label : 'Menú'}</span>
        <ChevronDown size={14} className={open ? 'nav-menu-chevron open' : 'nav-menu-chevron'} />
      </button>

      {open && (
        <div className="nav-menu-dropdown" role="menu">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                className={`nav-menu-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onSelect(item.id);
                  setOpen(false);
                }}
              >
                {Icon && <Icon size={16} />}
                <div className="nav-menu-item-text">
                  <span className="nav-menu-item-label">{item.label}</span>
                  {item.description && (
                    <span className="nav-menu-item-desc">{item.description}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NavMenu;
