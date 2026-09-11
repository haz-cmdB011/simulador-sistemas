import React, { useState, useMemo } from 'react';
import {
  UtensilsCrossed, Pizza, Salad, IceCream, Coffee, Sandwich, Plus, Minus,
  Trash2, ShoppingBag, Clock, CheckCircle2
} from 'lucide-react';

// Menú de muestra al estilo Uber Eats / Didi Food. No hay entrega real ni
// cobro real: "Realizar pedido" solo simula el flujo completo.
const PLATILLOS = [
  { id: 1, nombre: 'Hamburguesa Doble', descripcion: 'Res, queso cheddar, tocino y papas', precio: 129, categoria: 'Comida Rápida', icon: Sandwich, color: '#ff9500' },
  { id: 2, nombre: 'Alitas BBQ (10pz)', descripcion: 'Bañadas en salsa BBQ ahumada', precio: 149, categoria: 'Comida Rápida', icon: Sandwich, color: '#ff9500' },
  { id: 3, nombre: 'Pizza Pepperoni Grande', descripcion: 'Masa artesanal, doble pepperoni', precio: 189, categoria: 'Pizza', icon: Pizza, color: '#ff3b30' },
  { id: 4, nombre: 'Pizza Hawaiana Mediana', descripcion: 'Piña, jamón y queso mozzarella', precio: 159, categoria: 'Pizza', icon: Pizza, color: '#ff3b30' },
  { id: 5, nombre: 'Rollo California (8pz)', descripcion: 'Surimi, aguacate y pepino', precio: 119, categoria: 'Sushi', icon: UtensilsCrossed, color: '#2997ff' },
  { id: 6, nombre: 'Combo Nigiri Mixto', descripcion: '12 piezas variadas del chef', precio: 219, categoria: 'Sushi', icon: UtensilsCrossed, color: '#2997ff' },
  { id: 7, nombre: 'Ensalada César con Pollo', descripcion: 'Lechuga romana, aderezo y crutones', precio: 109, categoria: 'Saludable', icon: Salad, color: '#34c759' },
  { id: 8, nombre: 'Bowl de Quinoa y Vegetales', descripcion: 'Quinoa, garbanzo, pepino y limón', precio: 99, categoria: 'Saludable', icon: Salad, color: '#34c759' },
  { id: 9, nombre: 'Pastel de Chocolate', descripcion: 'Rebanada con ganache y fresas', precio: 65, categoria: 'Postres', icon: IceCream, color: '#db2777' },
  { id: 10, nombre: 'Helado Artesanal (2 bolas)', descripcion: 'Sabor a elegir, con barquillo', precio: 55, categoria: 'Postres', icon: IceCream, color: '#db2777' },
  { id: 11, nombre: 'Café Latte Grande', descripcion: 'Espresso doble con leche vaporizada', precio: 49, categoria: 'Bebidas', icon: Coffee, color: '#5e5ce6' },
  { id: 12, nombre: 'Limonada Natural', descripcion: '500ml, endulzada al gusto', precio: 39, categoria: 'Bebidas', icon: Coffee, color: '#5e5ce6' }
];

const CATEGORIAS = ['Todo', ...Array.from(new Set(PLATILLOS.map((p) => p.categoria)))];
const COSTO_ENVIO = 35;

const formatoMXN = (val) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0);

/**
 * Menú de comida para pedir a domicilio, al estilo Uber Eats / Didi Food:
 * categorías, platillos con cantidad, carrito con subtotal + envío, y un
 * botón de pedido que simula la confirmación con un tiempo estimado de
 * entrega (nada de esto procesa un pago ni una entrega real).
 */
export const FoodMenu = ({ onActivity }) => {
  const [categoria, setCategoria] = useState('Todo');
  const [carrito, setCarrito] = useState([]); // [{ id, cantidad }]
  const [confirmacion, setConfirmacion] = useState(null);

  const platillosFiltrados = useMemo(
    () => (categoria === 'Todo' ? PLATILLOS : PLATILLOS.filter((p) => p.categoria === categoria)),
    [categoria]
  );

  const agregarAlCarrito = (platillo) => {
    setCarrito((prev) => {
      const existente = prev.find((item) => item.id === platillo.id);
      if (existente) {
        return prev.map((item) => (item.id === platillo.id ? { ...item, cantidad: item.cantidad + 1 } : item));
      }
      return [...prev, { id: platillo.id, cantidad: 1 }];
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
    .map((item) => ({ ...item, platillo: PLATILLOS.find((p) => p.id === item.id) }))
    .filter((item) => item.platillo);

  const subtotal = itemsCarrito.reduce((acc, item) => acc + item.platillo.precio * item.cantidad, 0);
  const total = itemsCarrito.length > 0 ? subtotal + COSTO_ENVIO : 0;
  const cantidadTotal = itemsCarrito.reduce((acc, item) => acc + item.cantidad, 0);

  const realizarPedido = () => {
    if (itemsCarrito.length === 0) return;
    const minutos = 20 + Math.floor(Math.random() * 20);
    setConfirmacion({ total, minutos });
    onActivity?.({
      tipo: 'Pedido de comida',
      detalle: `${cantidadTotal} platillo(s) por ${formatoMXN(total)}`,
      monto: total
    });
    setCarrito([]);
    setTimeout(() => setConfirmacion(null), 5000);
  };

  return (
    <div className="store-layout">
      <div className="glass-card store-catalog-card">
        <div className="card-header">
          <h2 className="card-title">
            <UtensilsCrossed size={20} color="var(--primary-light)" />
            Menú de Comida a Domicilio
          </h2>
        </div>

        <div className="store-categories" style={{ marginBottom: '1.1rem' }}>
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

        <div className="food-item-list">
          {platillosFiltrados.map((platillo) => {
            const Icon = platillo.icon;
            const enCarrito = carrito.find((item) => item.id === platillo.id);
            return (
              <div key={platillo.id} className="food-item-row">
                <div className="store-product-thumb food-item-thumb" style={{ background: platillo.color }}>
                  <Icon size={22} color="rgba(255,255,255,0.9)" />
                </div>
                <div className="food-item-info">
                  <h4 className="store-product-name">{platillo.nombre}</h4>
                  <p className="food-item-desc">{platillo.descripcion}</p>
                  <span className="store-product-price">{formatoMXN(platillo.precio)}</span>
                </div>
                {enCarrito ? (
                  <div className="store-qty-stepper">
                    <button type="button" onClick={() => cambiarCantidad(platillo.id, -1)}>
                      <Minus size={13} />
                    </button>
                    <span>{enCarrito.cantidad}</span>
                    <button type="button" onClick={() => cambiarCantidad(platillo.id, 1)}>
                      <Plus size={13} />
                    </button>
                  </div>
                ) : (
                  <button type="button" className="store-add-btn" onClick={() => agregarAlCarrito(platillo)}>
                    <Plus size={14} /> Agregar
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-card store-cart-card">
        <div className="card-header">
          <h3 className="card-title" style={{ fontSize: '0.95rem' }}>
            <ShoppingBag size={17} /> Tu pedido {cantidadTotal > 0 && `(${cantidadTotal})`}
          </h3>
        </div>

        {confirmacion && (
          <div className="store-confirmation">
            <CheckCircle2 size={18} />
            <div>
              <strong>¡Pedido simulado en camino!</strong>
              <p className="food-eta">
                <Clock size={13} /> Llega en aprox. {confirmacion.minutos} min · {formatoMXN(confirmacion.total)}
              </p>
            </div>
          </div>
        )}

        {itemsCarrito.length === 0 ? (
          <p className="store-cart-empty">Aún no agregas platillos a tu pedido.</p>
        ) : (
          <>
            <div className="store-cart-items">
              {itemsCarrito.map((item) => (
                <div key={item.id} className="store-cart-item">
                  <div className="store-cart-item-info">
                    <span className="store-cart-item-name">{item.platillo.nombre}</span>
                    <span className="store-cart-item-price">
                      {item.cantidad} × {formatoMXN(item.platillo.precio)}
                    </span>
                  </div>
                  <button type="button" className="store-cart-remove" onClick={() => quitarDelCarrito(item.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="store-cart-total-row" style={{ paddingBottom: 0, borderBottom: 'none' }}>
              <span>Subtotal</span>
              <span>{formatoMXN(subtotal)}</span>
            </div>
            <div className="store-cart-total-row" style={{ paddingTop: '0.35rem' }}>
              <span>Envío</span>
              <span>{formatoMXN(COSTO_ENVIO)}</span>
            </div>
            <div className="store-cart-total-row store-cart-total-final">
              <span>Total</span>
              <span>{formatoMXN(total)}</span>
            </div>

            <button type="button" className="btn-submit" onClick={realizarPedido}>
              Realizar pedido (simulado)
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default FoodMenu;
