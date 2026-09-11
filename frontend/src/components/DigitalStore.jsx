import React, { useState, useMemo } from 'react';
import {
  ShoppingCart, Star, Plus, Minus, Trash2, BookOpen, Gamepad2, Code2,
  GraduationCap, Disc3, Image as ImageIcon, Search, CheckCircle2
} from 'lucide-react';

// Catálogo de muestra (no persiste en base de datos, solo mientras la
// pestaña está abierta). El "pago" es completamente simulado: no se procesa
// ningún cargo real ni se guarda ningún método de pago.
const PRODUCTOS = [
  { id: 1, nombre: 'Cielo de Papel — Novela digital', categoria: 'Ebooks', precio: 129, calificacion: 4.7, ventas: '3.1k', icon: BookOpen, color: '#2997ff' },
  { id: 2, nombre: 'Código Limpio: Guía Práctica', categoria: 'Ebooks', precio: 189, calificacion: 4.9, ventas: '5.4k', icon: BookOpen, color: '#2997ff' },
  { id: 3, nombre: 'SuiteEdit Pro — Licencia 1 año', categoria: 'Software', precio: 899, calificacion: 4.5, ventas: '890', icon: Code2, color: '#5e5ce6' },
  { id: 4, nombre: 'VPN Escudo Total — 12 meses', categoria: 'Software', precio: 449, calificacion: 4.3, ventas: '2.2k', icon: Code2, color: '#5e5ce6' },
  { id: 5, nombre: 'Curso: React desde Cero', categoria: 'Cursos', precio: 349, calificacion: 4.8, ventas: '7.9k', icon: GraduationCap, color: '#34c759' },
  { id: 6, nombre: 'Curso: Finanzas Personales', categoria: 'Cursos', precio: 259, calificacion: 4.6, ventas: '4.1k', icon: GraduationCap, color: '#34c759' },
  { id: 7, nombre: 'Reino de Cristal — Clave de juego', categoria: 'Videojuegos', precio: 599, calificacion: 4.4, ventas: '1.6k', icon: Gamepad2, color: '#ff3b30' },
  { id: 8, nombre: 'Carrera Infinita — Clave de juego', categoria: 'Videojuegos', precio: 279, calificacion: 4.2, ventas: '3.7k', icon: Gamepad2, color: '#ff3b30' },
  { id: 9, nombre: 'Horizonte Azul — Álbum digital', categoria: 'Música', precio: 99, calificacion: 4.9, ventas: '9.2k', icon: Disc3, color: '#db2777' },
  { id: 10, nombre: 'Paquete 200 Fotos Stock 4K', categoria: 'Fotografía', precio: 199, calificacion: 4.5, ventas: '1.1k', icon: ImageIcon, color: '#ff9500' }
];

const CATEGORIAS = ['Todas', ...Array.from(new Set(PRODUCTOS.map((p) => p.categoria)))];

const formatoMXN = (val) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0);

/**
 * Tienda digital de muestra, al estilo de un marketplace como Amazon:
 * catálogo con filtro por categoría y búsqueda, carrito con cantidades, y
 * un botón de "Pagar" que simula la compra (no hay cobro real de ningún
 * tipo — ni tarjeta ni pasarela de pago).
 */
export const DigitalStore = ({ onActivity }) => {
  const [categoria, setCategoria] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState([]); // [{ id, cantidad }]
  const [confirmacion, setConfirmacion] = useState(null);

  const productosFiltrados = useMemo(() => {
    return PRODUCTOS.filter((p) => {
      const coincideCategoria = categoria === 'Todas' || p.categoria === categoria;
      const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase());
      return coincideCategoria && coincideBusqueda;
    });
  }, [categoria, busqueda]);

  const agregarAlCarrito = (producto) => {
    setCarrito((prev) => {
      const existente = prev.find((item) => item.id === producto.id);
      if (existente) {
        return prev.map((item) => (item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item));
      }
      return [...prev, { id: producto.id, cantidad: 1 }];
    });
  };

  const cambiarCantidad = (id, delta) => {
    setCarrito((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, cantidad: item.cantidad + delta } : item))
        .filter((item) => item.cantidad > 0)
    );
  };

  const quitarDelCarrito = (id) => {
    setCarrito((prev) => prev.filter((item) => item.id !== id));
  };

  const itemsCarrito = carrito
    .map((item) => ({ ...item, producto: PRODUCTOS.find((p) => p.id === item.id) }))
    .filter((item) => item.producto);

  const totalCarrito = itemsCarrito.reduce((acc, item) => acc + item.producto.precio * item.cantidad, 0);
  const cantidadTotal = itemsCarrito.reduce((acc, item) => acc + item.cantidad, 0);

  const pagar = () => {
    if (itemsCarrito.length === 0) return;
    setConfirmacion({
      total: totalCarrito,
      articulos: cantidadTotal
    });
    onActivity?.({
      tipo: 'Compra en tienda',
      detalle: `${cantidadTotal} artículo(s) por ${formatoMXN(totalCarrito)}`,
      monto: totalCarrito
    });
    setCarrito([]);
    setTimeout(() => setConfirmacion(null), 4500);
  };

  return (
    <div className="store-layout">
      <div className="glass-card store-catalog-card">
        <div className="card-header">
          <h2 className="card-title">
            <ShoppingCart size={20} color="var(--primary-light)" />
            Tienda Digital
          </h2>
        </div>

        <div className="store-toolbar">
          <div className="store-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="store-categories">
            {CATEGORIAS.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`store-category-pill ${cat === categoria ? 'active' : ''}`}
                onClick={() => setCategoria(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="store-product-grid">
          {productosFiltrados.map((producto) => {
            const Icon = producto.icon;
            const enCarrito = carrito.find((item) => item.id === producto.id);
            return (
              <div key={producto.id} className="store-product-card">
                <div className="store-product-thumb" style={{ background: producto.color }}>
                  <Icon size={26} color="rgba(255,255,255,0.9)" />
                </div>
                <span className="store-product-category">{producto.categoria}</span>
                <h4 className="store-product-name">{producto.nombre}</h4>
                <div className="store-product-rating">
                  <Star size={13} fill="var(--warning)" color="var(--warning)" />
                  <span>{producto.calificacion}</span>
                  <span className="store-product-sales">· {producto.ventas} vendidos</span>
                </div>
                <div className="store-product-footer">
                  <span className="store-product-price">{formatoMXN(producto.precio)}</span>
                  {enCarrito ? (
                    <div className="store-qty-stepper">
                      <button type="button" onClick={() => cambiarCantidad(producto.id, -1)}>
                        <Minus size={13} />
                      </button>
                      <span>{enCarrito.cantidad}</span>
                      <button type="button" onClick={() => cambiarCantidad(producto.id, 1)}>
                        <Plus size={13} />
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="store-add-btn" onClick={() => agregarAlCarrito(producto)}>
                      <Plus size={14} /> Agregar
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {productosFiltrados.length === 0 && (
            <div className="store-empty-results">No hay productos que coincidan con tu búsqueda.</div>
          )}
        </div>
      </div>

      <div className="glass-card store-cart-card">
        <div className="card-header">
          <h3 className="card-title" style={{ fontSize: '0.95rem' }}>
            <ShoppingCart size={17} /> Tu carrito {cantidadTotal > 0 && `(${cantidadTotal})`}
          </h3>
        </div>

        {confirmacion && (
          <div className="store-confirmation">
            <CheckCircle2 size={18} />
            <div>
              <strong>¡Compra simulada con éxito!</strong>
              <p>{confirmacion.articulos} artículo(s) · {formatoMXN(confirmacion.total)}</p>
            </div>
          </div>
        )}

        {itemsCarrito.length === 0 ? (
          <p className="store-cart-empty">Tu carrito está vacío. Agrega productos del catálogo.</p>
        ) : (
          <>
            <div className="store-cart-items">
              {itemsCarrito.map((item) => (
                <div key={item.id} className="store-cart-item">
                  <div className="store-cart-item-info">
                    <span className="store-cart-item-name">{item.producto.nombre}</span>
                    <span className="store-cart-item-price">
                      {item.cantidad} × {formatoMXN(item.producto.precio)}
                    </span>
                  </div>
                  <button type="button" className="store-cart-remove" onClick={() => quitarDelCarrito(item.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="store-cart-total-row">
              <span>Total</span>
              <span>{formatoMXN(totalCarrito)}</span>
            </div>

            <button type="button" className="btn-submit" onClick={pagar}>
              Pagar (simulado)
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default DigitalStore;
