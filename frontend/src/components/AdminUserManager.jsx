import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, KeyRound, RefreshCw, AlertCircle, CheckCircle2, X } from 'lucide-react';

const API_URL = "https://simulador-backend-pt4w.onrender.com";

/**
 * Panel exclusivo para el rol 'desarrollador': lista a todos los usuarios
 * registrados y permite fijarles una contraseña nueva directamente (sin
 * depender de que el correo de recuperación les llegue). Usa el backend
 * (rutas /api/admin/*), que a su vez usa la Service Role Key de Supabase —
 * esa clave nunca toca el navegador.
 */
export const AdminUserManager = () => {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const cargarUsuarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/admin/usuarios`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'No se pudo cargar la lista de usuarios.');
      }
      setUsuarios(data.usuarios || []);
    } catch (err) {
      console.error('[AdminUserManager] Error al cargar usuarios:', err);
      setError(
        err.message.includes('Failed to fetch')
          ? 'No se pudo conectar con el servidor backend en Render.'
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const abrirReset = (u) => {
    setActiveUser(u);
    setNuevaContrasena('');
    setConfirmarContrasena('');
  };

  const cerrarReset = () => {
    setActiveUser(null);
    setNuevaContrasena('');
    setConfirmarContrasena('');
  };

  const confirmarReset = async (e) => {
    e.preventDefault();

    if (nuevaContrasena.length < 6) {
      showNotification('La contraseña debe tener al menos 6 caracteres.', 'error');
      return;
    }
    if (nuevaContrasena !== confirmarContrasena) {
      showNotification('Las contraseñas no coinciden.', 'error');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/usuarios/${activeUser.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({ nuevaContrasena })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'No se pudo restablecer la contraseña.');
      }
      showNotification(data.mensaje || 'Contraseña actualizada correctamente.', 'success');
      cerrarReset();
    } catch (err) {
      console.error('[AdminUserManager] Error al restablecer contraseña:', err);
      showNotification(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card" style={{ marginBottom: '2rem' }}>
      <div className="card-header">
        <h2 className="card-title" style={{ color: 'var(--primary-light)' }}>
          <Users size={20} />
          Gestión de Contraseñas de Usuarios
        </h2>
        <button
          type="button"
          onClick={cargarUsuarios}
          title="Actualizar lista"
          style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
        </button>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
        Restablece la contraseña de cualquier usuario registrado, al instante, sin depender del correo de recuperación.
      </p>

      {notification && (
        <div
          className={`notification-toast ${notification.type}`}
          style={{ position: 'static', marginBottom: '1rem', width: '100%', animation: 'none' }}
        >
          {notification.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{notification.msg}</span>
        </div>
      )}

      {error && (
        <div className="error-banner" style={{ marginBottom: '1rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Cargando usuarios...</p>
      ) : usuarios.length === 0 ? (
        !error && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No hay usuarios registrados todavía.</p>
      ) : (
        <div className="table-wrapper">
          <table className="sim-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>{u.nombre}</td>
                  <td>{u.email}</td>
                  <td><span className="role-level-pill">{u.rol}</span></td>
                  <td style={{ textAlign: 'center' }}>
                    <button type="button" className="btn-destructive-secondary" onClick={() => abrirReset(u)}>
                      <KeyRound size={14} />
                      <span>Restablecer contraseña</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeUser && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem'
          }}
        >
          <div className="glass-card" style={{ maxWidth: '380px', width: '100%', position: 'relative' }}>
            <button
              type="button"
              onClick={cerrarReset}
              title="Cerrar"
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>

            <h3 style={{ marginBottom: '0.25rem' }}>Nueva contraseña</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Para <strong>{activeUser.nombre}</strong> ({activeUser.email})
            </p>

            <form onSubmit={confirmarReset} className="sim-form">
              <div className="form-group">
                <label className="form-label" htmlFor="admin-new-password">Nueva contraseña</label>
                <div className="input-wrapper">
                  <KeyRound size={18} className="input-icon" />
                  <input
                    id="admin-new-password"
                    type="password"
                    className="form-input"
                    value={nuevaContrasena}
                    onChange={(e) => setNuevaContrasena(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="admin-confirm-password">Confirmar contraseña</label>
                <div className="input-wrapper">
                  <KeyRound size={18} className="input-icon" />
                  <input
                    id="admin-confirm-password"
                    type="password"
                    className="form-input"
                    value={confirmarContrasena}
                    onChange={(e) => setConfirmarContrasena(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar nueva contraseña'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManager;
