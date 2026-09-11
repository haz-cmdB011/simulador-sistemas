import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, KeyRound, RefreshCw, AlertCircle, CheckCircle2, X, UserPlus, Save, Trash2 } from 'lucide-react';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

const API_URL = "https://simulador-backend-pt4w.onrender.com";
const LONGITUD_MINIMA_PASSWORD = 8;

// Roles que el Desarrollador puede asignar desde este panel. El rol
// 'desarrollador' (Nivel 1) es exclusivo del Creador y no aparece aquí.
const ROLES_ASIGNABLES = [
  { value: 'administrativo', label: 'Administrativo (Nivel 2)' },
  { value: 'operador', label: 'Operador (Nivel 3)' },
  { value: 'usuario', label: 'Usuario (Nivel 4)' }
];

/**
 * Panel exclusivo para el rol 'desarrollador': lista a todos los usuarios
 * registrados, permite crear cuentas nuevas directamente (con el rol que se
 * elija), cambiar el rol de cualquier cuenta existente entre Nivel 2 y
 * Nivel 4, y fijarle una contraseña nueva a cualquiera al instante. Todo
 * pasa por el backend (rutas /api/admin/*), que usa la Service Role Key de
 * Supabase — esa clave nunca toca el navegador.
 */
export const AdminUserManager = () => {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // --- Restablecer contraseña ---
  const [activeUser, setActiveUser] = useState(null);
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // --- Crear usuario nuevo ---
  const [showCrearForm, setShowCrearForm] = useState(false);
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaPasswordCrear, setNuevaPasswordCrear] = useState('');
  const [nuevoRol, setNuevoRol] = useState('usuario');
  const [creando, setCreando] = useState(false);

  // --- Cambiar rol por fila ---
  const [rolEditando, setRolEditando] = useState({}); // { [id]: rolSeleccionado }
  const [guardandoRolId, setGuardandoRolId] = useState(null);

  // --- Eliminar usuario ---
  const [eliminandoId, setEliminandoId] = useState(null);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const authHeaders = (extra = {}) => ({
    Authorization: `Bearer ${user.token}`,
    ...extra
  });

  const cargarUsuarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/admin/usuarios`, {
        headers: authHeaders()
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.details || data.error || 'No se pudo cargar la lista de usuarios.');
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

  // --- Crear usuario ---
  const resetFormCrear = () => {
    setNuevoEmail('');
    setNuevoNombre('');
    setNuevaPasswordCrear('');
    setNuevoRol('usuario');
  };

  const crearUsuario = async (e) => {
    e.preventDefault();

    if (nuevaPasswordCrear.length < LONGITUD_MINIMA_PASSWORD) {
      showNotification(`La contraseña debe tener al menos ${LONGITUD_MINIMA_PASSWORD} caracteres.`, 'error');
      return;
    }

    setCreando(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/usuarios`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          email: nuevoEmail,
          password: nuevaPasswordCrear,
          nombre: nuevoNombre,
          rol: nuevoRol
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.details || data.error || 'No se pudo crear el usuario.');
      }
      showNotification(data.mensaje || 'Usuario creado correctamente.', 'success');
      resetFormCrear();
      setShowCrearForm(false);
      cargarUsuarios();
    } catch (err) {
      console.error('[AdminUserManager] Error al crear usuario:', err);
      showNotification(err.message, 'error');
    } finally {
      setCreando(false);
    }
  };

  // --- Cambiar rol ---
  const cambiarRol = async (usuario) => {
    const nuevoRolSeleccionado = rolEditando[usuario.id];
    if (!nuevoRolSeleccionado || nuevoRolSeleccionado === usuario.rol) return;

    setGuardandoRolId(usuario.id);
    try {
      const response = await fetch(`${API_URL}/api/admin/usuarios/${usuario.id}/rol`, {
        method: 'PATCH',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ rol: nuevoRolSeleccionado })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.details || data.error || 'No se pudo cambiar el rol.');
      }
      showNotification(data.mensaje || 'Rol actualizado correctamente.', 'success');
      cargarUsuarios();
    } catch (err) {
      console.error('[AdminUserManager] Error al cambiar rol:', err);
      showNotification(err.message, 'error');
    } finally {
      setGuardandoRolId(null);
    }
  };

  // --- Eliminar usuario ---
  const eliminarUsuario = async (u) => {
    const confirmado = window.confirm(
      `¿Seguro que quieres eliminar permanentemente a ${u.nombre} (${u.email})?\n\nEsta acción no se puede deshacer: se borra su acceso y su perfil.`
    );
    if (!confirmado) return;

    setEliminandoId(u.id);
    try {
      const response = await fetch(`${API_URL}/api/admin/usuarios/${u.id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.details || data.error || 'No se pudo eliminar el usuario.');
      }
      showNotification(data.mensaje || 'Usuario eliminado correctamente.', 'success');
      setUsuarios((prev) => prev.filter((x) => x.id !== u.id));
    } catch (err) {
      console.error('[AdminUserManager] Error al eliminar usuario:', err);
      showNotification(err.message, 'error');
    } finally {
      setEliminandoId(null);
    }
  };

  // --- Restablecer contraseña ---
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

    if (nuevaContrasena.length < LONGITUD_MINIMA_PASSWORD) {
      showNotification(`La contraseña debe tener al menos ${LONGITUD_MINIMA_PASSWORD} caracteres.`, 'error');
      return;
    }
    if (nuevaContrasena !== confirmarContrasena) {
      showNotification('Las contraseñas no coinciden.', 'error');
      return;
    }

    setSavingPassword(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/usuarios/${activeUser.id}/reset-password`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ nuevaContrasena })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.details || data.error || 'No se pudo restablecer la contraseña.');
      }
      showNotification(data.mensaje || 'Contraseña actualizada correctamente.', 'success');
      cerrarReset();
    } catch (err) {
      console.error('[AdminUserManager] Error al restablecer contraseña:', err);
      showNotification(err.message, 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="glass-card" style={{ marginBottom: '2rem' }}>
      <div className="card-header">
        <h2 className="card-title" style={{ color: 'var(--primary-light)' }}>
          <Users size={20} />
          Gestión de Usuarios
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn-destructive-secondary"
            onClick={() => setShowCrearForm((v) => !v)}
          >
            <UserPlus size={14} />
            <span>{showCrearForm ? 'Cancelar' : 'Nuevo usuario'}</span>
          </button>
          <button
            type="button"
            onClick={cargarUsuarios}
            title="Actualizar lista"
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
        Crea usuarios nuevos, cambia el rol de cualquier cuenta (Nivel 2 a Nivel 4) y restablece contraseñas al instante.
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

      {showCrearForm && (
        <form
          onSubmit={crearUsuario}
          className="sim-form"
          style={{
            marginBottom: '1.5rem',
            padding: '1.25rem',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px'
          }}
        >
          <div className="form-group">
            <label className="form-label" htmlFor="nuevo-nombre">Nombre completo</label>
            <div className="input-wrapper">
              <input
                id="nuevo-nombre"
                type="text"
                className="form-input"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="nuevo-email">Correo electrónico</label>
            <div className="input-wrapper">
              <input
                id="nuevo-email"
                type="email"
                className="form-input"
                value={nuevoEmail}
                onChange={(e) => setNuevoEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="nueva-password-crear">Contraseña inicial</label>
            <div className="input-wrapper">
              <input
                id="nueva-password-crear"
                type="password"
                className="form-input"
                value={nuevaPasswordCrear}
                onChange={(e) => setNuevaPasswordCrear(e.target.value)}
                minLength={LONGITUD_MINIMA_PASSWORD}
                required
              />
            </div>
            <PasswordStrengthMeter password={nuevaPasswordCrear} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="nuevo-rol">Rol</label>
            <div className="input-wrapper">
              <select
                id="nuevo-rol"
                className="form-input"
                value={nuevoRol}
                onChange={(e) => setNuevoRol(e.target.value)}
              >
                {ROLES_ASIGNABLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={creando}>
            {creando ? 'Creando...' : 'Crear usuario'}
          </button>
        </form>
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
                <th>Rol actual</th>
                <th>Cambiar rol</th>
                <th style={{ textAlign: 'center' }}>Contraseña</th>
                <th style={{ textAlign: 'center' }}>Eliminar</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => {
                const esDesarrollador = u.rol === 'desarrollador';
                const rolSeleccionado = rolEditando[u.id] ?? (esDesarrollador ? '' : u.rol);
                return (
                  <tr key={u.id}>
                    <td>{u.nombre}</td>
                    <td>{u.email}</td>
                    <td><span className="role-level-pill">{u.rol}</span></td>
                    <td>
                      {esDesarrollador ? (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No editable</span>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <select
                            className="form-input"
                            style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                            value={rolSeleccionado}
                            onChange={(e) =>
                              setRolEditando((prev) => ({ ...prev, [u.id]: e.target.value }))
                            }
                          >
                            {ROLES_ASIGNABLES.map((r) => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="btn-destructive-secondary"
                            disabled={guardandoRolId === u.id || rolSeleccionado === u.rol}
                            onClick={() => cambiarRol(u)}
                            title="Guardar nuevo rol"
                          >
                            <Save size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button type="button" className="btn-destructive-secondary" onClick={() => abrirReset(u)}>
                        <KeyRound size={14} />
                        <span>Restablecer</span>
                      </button>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {esDesarrollador ? (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No editable</span>
                      ) : (
                        <button
                          type="button"
                          className="btn-destructive"
                          disabled={eliminandoId === u.id}
                          onClick={() => eliminarUsuario(u)}
                          title="Eliminar usuario permanentemente"
                        >
                          <Trash2 size={14} />
                          <span>{eliminandoId === u.id ? 'Eliminando...' : 'Eliminar'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
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
                    minLength={LONGITUD_MINIMA_PASSWORD}
                    required
                  />
                </div>
                <PasswordStrengthMeter password={nuevaContrasena} />
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
                    minLength={LONGITUD_MINIMA_PASSWORD}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-submit" disabled={savingPassword}>
                {savingPassword ? 'Guardando...' : 'Guardar nueva contraseña'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManager;
