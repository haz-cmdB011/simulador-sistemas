import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Menu, ChevronDown } from 'lucide-react';

/**
 * Menú desplegable de navegación. Recibe una lista de secciones disponibles
 * para el rol del usuario actual y muestra solo una a la vez (la que esté
 * activa), en vez de tener todos los paneles apilados uno debajo del otro en
 * la misma pantalla. Así cada tipo de usuario ve nada más las funciones que
 * le corresponden, sin saturar la pantalla con información que no necesita
 * en ese momento.
 *
 * El desplegable y su telón se renderizan con un portal directo a <body>,
 * fuera de la tarjeta de vidrio (glass-card) donde vive el botón. Es
 * necesario porque esa tarjeta usa backdrop-filter, y backdrop-filter crea
 * su propio "contexto de apilamiento": cualquier overlay que se quede
 * adentro queda atrapado ahí y una tarjeta hermana que aparece después en
 * la página (por ejemplo el simulador) termina pintándose ENCIMA de él,
 * aunque tenga un z-index más alto. Sacándolo por portal, el desplegable
 * vive directamente bajo <body> y ya no compite por capas con nada.
 *
 * @param {{ id: string, label: string, icon: React.ComponentType, description?: string }[]} items
 * @param {string} activeId
 * @param {(id: string) => void} onSelect
 */
export const NavMenu = ({ items, activeId, onSelect }) => {
  const [open, setOpen] = useState(false);
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
    // menú quedaría apuntando a una posición vieja — más simple y
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

  const activeItem = items.find((i) => i.id === activeId) || items[0];

  return (
    <div className="nav-menu-wrapper">
      <button
        type="button"
        ref={triggerRef}
        className="nav-menu-trigger"
        onClick={toggleOpen}
        aria-expanded={open}
      >
        <Menu size={16} />
        <span>{activeItem ? activeItem.label : 'Menú'}</span>
        <ChevronDown size={14} className={open ? 'nav-menu-chevron open' : 'nav-menu-chevron'} />
      </button>

      {createPortal(
        <>
          {/* Telón: intercepta cualquier clic fuera del menú y lo cierra,
              en vez de dejar que ese clic le llegue a lo que hay debajo. */}
          <div
            className={`ui-backdrop ${open ? 'open' : ''}`}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div
            className={`nav-menu-dropdown ${open ? 'open' : ''}`}
            role="menu"
            aria-hidden={!open}
            style={{ top: coords.top, right: coords.right }}
          >
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activeId;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  tabIndex={open ? 0 : -1}
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
        </>,
        document.body
      )}
    </div>
  );
};

export default NavMenu;
