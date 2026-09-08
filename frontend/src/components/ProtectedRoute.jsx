import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Lock, ArrowLeft } from 'lucide-react';

/**
 * Componente que protege vistas según el rol del usuario autenticado.
 *
 * @param {Array<string>} allowedRoles - Lista de roles autorizados (ej. ['admin', 'operador'])
 * @param {number} minLevel - Nivel mínimo de jerarquía (1: Usuario, 2: Operador, 3: Admin)
 * @param {React.ReactNode} children - Vista protegida
 */
export const ProtectedRoute = ({ allowedRoles = [], minLevel, children, fallback }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p>Verificando credenciales de acceso...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="glass-card unauthorized-card">
        <div className="unauthorized-icon">
          <Lock size={32} />
        </div>
        <h3>Acceso Restringido</h3>
        <p>Debes iniciar sesión para acceder a este módulo.</p>
      </div>
    );
  }

  // Comprobar roles específicos
  const roleAllowed =
    allowedRoles.length === 0 || allowedRoles.includes(user.rol);

  // Comprobar nivel mínimo de prioridad
  const levelAllowed = minLevel ? (user.nivel_prioridad || 1) >= minLevel : true;

  if (!roleAllowed || !levelAllowed) {
    if (fallback) return fallback;

    return (
      <div className="glass-card unauthorized-card">
        <div className="unauthorized-icon" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
          <ShieldAlert size={36} />
        </div>
        <h3>Permisos Insuficientes</h3>
        <p>
          Tu rol actual es <strong>{user.rol?.toUpperCase()}</strong> (Nivel {user.nivel_prioridad}).
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Este módulo requiere rol: {allowedRoles.join(' o ') || `Nivel ${minLevel}`}.
        </p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
