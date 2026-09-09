import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Lock } from 'lucide-react';

/**
 * Componente que protege vistas según el rol y jerarquía del usuario autenticado.
 *
 * Jerarquía:
 * - Nivel 1: desarrollador (Control total y exclusivo para el Creador - peso 4)
 * - Nivel 2: administrativo (Visualización y gestión del sistema - peso 3)
 * - Nivel 3: operador (Ejecución y captura operacional estándar - peso 2)
 * - Nivel 4: usuario (Acceso básico de consulta y perfil personal - peso 1)
 *
 * @param {Array<string>} allowedRoles - Lista de roles autorizados
 * @param {number} minWeight - Peso mínimo de jerarquía (1 a 4)
 * @param {React.ReactNode} children - Vista protegida
 * @param {React.ReactNode} fallback - Componente alternativo en caso de rechazo
 */
export const ProtectedRoute = ({ allowedRoles = [], minWeight, children, fallback }) => {
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

  // Comprobar peso de jerarquía
  const weightAllowed = minWeight ? (user.peso || 1) >= minWeight : true;

  if (!roleAllowed || !weightAllowed) {
    if (fallback) return fallback;

    return (
      <div className="glass-card unauthorized-card">
        <div className="unauthorized-icon" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
          <ShieldAlert size={36} />
        </div>
        <h3>Permisos Insuficientes</h3>
        <p>
          Tu rol actual es <strong>{user.rol?.toUpperCase()}</strong> (Nivel {user.nivel || 4}).
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Este módulo requiere rol: {allowedRoles.join(' o ') || `Jerarquía de peso ${minWeight}`}.
        </p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
