import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import ResetPassword from './components/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';
import AdminUserManager from './components/AdminUserManager';
import NavMenu from './components/NavMenu';
import ThemeCustomizer from './components/ThemeCustomizer';
import AvatarUploader from './components/AvatarUploader';
import PixelCatEasterEgg from './components/PixelCatEasterEgg';
import {
  TrendingUp,
  Activity,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  User as UserIcon,
  Sliders,
  Database,
  Terminal,
  Trash2,
  Lock,
  Flame,
  LayoutGrid,
  Music2,
  ShoppingCart,
  UtensilsCrossed,
  Users
} from 'lucide-react';
import MusicPlayer from './components/MusicPlayer';
import DigitalStore from './components/DigitalStore';
import FoodMenu from './components/FoodMenu';

const API_URL = "https://simulador-backend-pt4w.onrender.com";

function SimuladorContent() {
  const { user, logout, hasRole, isDesarrollador, canDelete } = useAuth();

  // Sección visible actualmente. En vez de mostrar todos los paneles al
  // mismo tiempo (lo cual saturaba la pantalla de información), solo se
  // muestra uno a la vez, elegido desde el menú desplegable.
  const [activeSection, setActiveSection] = useState('simulador');

  // Sistema simulado activo dentro del panel "Sistemas" (submenú interno):
  // música, tienda o comida.
  const [activeSystem, setActiveSystem] = useState('musica');

  const [serverOnline, setServerOnline] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [notification, setNotification] = useState(null);

  const SISTEMAS = [
    { id: 'musica', label: 'Música', icon: Music2, description: 'Reproductor simulado, estilo Spotify' },
    { id: 'tienda', label: 'Tienda', icon: ShoppingCart, description: 'Marketplace digital, estilo Amazon' },
    { id: 'comida', label: 'Comida', icon: UtensilsCrossed, description: 'Pedidos a domicilio, estilo Uber Eats / Didi' }
  ];

  // Secciones del menú, armadas según lo que puede ver cada rol. Un
  // Desarrollador ve las cuatro; un Administrativo ve Sistemas +
  // Supervisión; Operador y Usuario solo ven Sistemas.
  const menuItems = useMemo(() => {
    const items = [
      {
        id: 'simulador',
        label: 'Sistemas',
        icon: LayoutGrid,
        description: 'Música, tienda y pedidos de comida simulados'
      }
    ];

    if (isDesarrollador) {
      items.push({
        id: 'consola',
        label: 'Consola Maestra',
        icon: Terminal,
        description: 'Base de datos, parámetros y auditoría'
      });
      items.push({
        id: 'usuarios',
        label: 'Gestión de Usuarios',
        icon: Users,
        description: 'Crear, editar y eliminar cuentas'
      });
    } else if (hasRole('administrativo')) {
      items.push({
        id: 'supervision',
        label: 'Panel de Supervisión',
        icon: ShieldAlert,
        description: 'Monitoreo y auditoría de actividad'
      });
    }

    return items;
  }, [isDesarrollador, hasRole]);

  // Comprobar salud del servidor backend
  const checkHealth = async () => {
    try {
      const response = await fetch(`${API_URL}/api/health`);
      if (response.ok) {
        setServerOnline(true);
      } else {
        setServerOnline(false);
      }
    } catch {
      setServerOnline(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Registra una actividad (compra en la tienda, pedido de comida) en la
  // bitácora que ven los paneles de Consola Maestra y Supervisión. Sustituye
  // al registro de simulaciones financieras que existía antes.
  const registrarActividad = ({ tipo, detalle, monto }) => {
    setAuditLogs((prev) => [
      {
        id: Date.now(),
        fecha: new Date().toLocaleTimeString(),
        usuario: user.email,
        rol: user.rol,
        tipo,
        detalle,
        monto
      },
      ...prev.slice(0, 19)
    ]);
  };

  // Acción destructiva: Eliminar registro individual de auditoría (Exclusivo Desarrollador)
  const handleDeleteAuditLog = (id) => {
    if (!canDelete) {
      showNotification('Acción bloqueada: Permiso reservado exclusivamente para Desarrollador.', 'error');
      return;
    }
    setAuditLogs((prev) => prev.filter((log) => log.id !== id));
    showNotification('Registro de auditoría eliminado correctamente.', 'success');
  };

  // Acción destructiva: Purgar toda la bitácora (Exclusivo Desarrollador)
  const handlePurgeAllLogs = () => {
    if (!canDelete) {
      showNotification('Acción bloqueada: Permiso reservado exclusivamente para Desarrollador.', 'error');
      return;
    }
    if (window.confirm('¿Confirmas purgar por completo la bitácora de auditoría de la sesión?')) {
      setAuditLogs([]);
      showNotification('Bitácora de auditoría purgada por el Desarrollador.', 'success');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(val || 0);
  };

  const getRoleBadge = () => {
    if (user?.rol === 'desarrollador') {
      return (
        <div className="user-role-pill role-desarrollador">
          <Terminal size={14} />
          <span>Desarrollador (Nivel 1)</span>
        </div>
      );
    }
    if (user?.rol === 'administrativo') {
      return (
        <div className="user-role-pill role-administrativo">
          <ShieldAlert size={14} />
          <span>Administrativo (Nivel 2)</span>
        </div>
      );
    }
    if (user?.rol === 'operador') {
      return (
        <div className="user-role-pill role-operador">
          <ShieldCheck size={14} />
          <span>Operador (Nivel 3)</span>
        </div>
      );
    }
    return (
      <div className="user-role-pill role-usuario">
        <UserIcon size={14} />
        <span>Usuario (Nivel 4)</span>
      </div>
    );
  };

  return (
    <div className="app-container">
      {/* Top User Session Navigation */}
      <div className="user-session-bar glass-card">
        <div className="user-profile-info">
          <AvatarUploader apiUrl={API_URL} />
          <div>
            <div className="user-name-row">
              <span className="user-display-name">{user?.nombre}</span>
              {getRoleBadge()}
            </div>
            <span className="user-email-text">{user?.email}</span>
          </div>
        </div>

        <div className="user-actions">
          {menuItems.length > 1 && (
            <NavMenu items={menuItems} activeId={activeSection} onSelect={setActiveSection} />
          )}

          <ThemeCustomizer />

          <div className="status-badge">
            <div
              className={`status-dot ${
                serverOnline === null
                  ? 'checking'
                  : serverOnline
                  ? 'online'
                  : 'offline'
              }`}
            />
            <span>
              {serverOnline === null
                ? 'Verificando API...'
                : serverOnline
                ? 'Backend API Conectado'
                : 'Backend Desconectado'}
            </span>
            <button
              onClick={checkHealth}
              title="Reintentar conexión"
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
            >
              <RefreshCw size={13} />
            </button>
          </div>

          <button onClick={logout} className="btn-logout" title="Cerrar Sesión">
            <LogOut size={16} />
            <span>Salir</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          {notification.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Main App Header */}
      <header className="app-header" style={{ marginTop: '1.5rem' }}>
        <div className="brand-area">
          <div className="brand-icon">
            <TrendingUp size={28} />
          </div>
          <div>
            <h1 className="brand-title">Simulador de Sistemas</h1>
            <p className="brand-subtitle">
              {user?.rol === 'desarrollador'
                ? 'Consola Maestra de Desarrollador • Control Total de Base de Datos y Parámetros'
                : user?.rol === 'administrativo'
                ? 'Panel de Gestión Administrativa • Monitoreo y Auditoría de Acciones'
                : user?.rol === 'operador'
                ? 'Consola de Operaciones • Música, Tienda y Pedidos de Comida'
                : 'Música, tienda digital y pedidos de comida — todo simulado'}
            </p>
          </div>
        </div>
      </header>

      {/* Panel Exclusivo para Desarrollador (Nivel 1): Consola Maestra */}
      {activeSection === 'consola' && isDesarrollador && (
        <ProtectedRoute allowedRoles={['desarrollador']}>
          <div className="glass-card dev-dashboard-card" style={{ marginBottom: '2rem' }}>
            <div className="card-header">
              <h2 className="card-title" style={{ color: 'var(--primary-light)' }}>
                <Terminal size={22} />
                Módulo Maestro de Desarrollador (Nivel 1 - Control Total)
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span className="dev-status-tag">
                  <Flame size={13} /> Control Total
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Privilegio exclusivo para el Creador: Edición profunda, auditoría de base de datos y ejecución de acciones destructivas.
            </p>

            <div className="admin-grid-features">
              <div className="admin-feature-box dev-box">
                <div className="feature-icon">
                  <Database size={20} color="var(--primary-light)" />
                </div>
                <div>
                  <h4>Base de Datos Supabase</h4>
                  <p>Perfiles, roles y almacenamiento de fotos de usuario</p>
                </div>
              </div>

              <div className="admin-feature-box dev-box">
                <div className="feature-icon">
                  <Sliders size={20} color="var(--secondary)" />
                </div>
                <div>
                  <h4>Sistemas Simulados Activos</h4>
                  <p>Música, Tienda Digital y Pedidos de Comida</p>
                </div>
              </div>

              <div className="admin-feature-box dev-box">
                <div className="feature-icon">
                  <Activity size={20} color="var(--accent)" />
                </div>
                <div>
                  <h4>Auditoría de Actividad</h4>
                  <p>{auditLogs.length} eventos registrados</p>
                </div>
              </div>
            </div>

            {/* Acciones Destructivas Exclusivas del Desarrollador */}
            <div className="dev-destructive-actions-bar">
              <span className="destructive-label">Acciones Destructivas (Solo Desarrollador):</span>
              <div className="destructive-btn-group">
                <button
                  type="button"
                  className="btn-destructive"
                  onClick={handlePurgeAllLogs}
                  disabled={auditLogs.length === 0}
                  title="Eliminar todos los registros de la bitácora"
                >
                  <Trash2 size={15} />
                  <span>Vaciar Bitácora ({auditLogs.length})</span>
                </button>
              </div>
            </div>

            {auditLogs.length > 0 && (
              <div className="admin-audit-table" style={{ marginTop: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Registros auditados en el sistema:
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {auditLogs.length} registros
                  </span>
                </div>
                <div className="table-wrapper">
                  <table className="sim-table">
                    <thead>
                      <tr>
                        <th>Hora</th>
                        <th>Usuario</th>
                        <th>Rol</th>
                        <th>Actividad</th>
                        <th>Detalle</th>
                        <th>Monto</th>
                        <th style={{ textAlign: 'center' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id}>
                          <td>{log.fecha}</td>
                          <td>{log.usuario}</td>
                          <td><span className="role-level-pill">{log.rol}</span></td>
                          <td><span className="role-level-pill">{log.tipo}</span></td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{log.detalle}</td>
                          <td className="gain-positive">{formatCurrency(log.monto)}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn-delete-row"
                              onClick={() => handleDeleteAuditLog(log.id)}
                              title="Eliminar este registro permanentemente"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </ProtectedRoute>
      )}

      {/* Gestión de usuarios (Exclusivo Desarrollador) */}
      {activeSection === 'usuarios' && isDesarrollador && (
        <ProtectedRoute allowedRoles={['desarrollador']}>
          <AdminUserManager />
        </ProtectedRoute>
      )}

      {/* Panel para Administrativo (Nivel 2) - Modo Supervisión y Lectura */}
      {activeSection === 'supervision' && hasRole('administrativo') && !isDesarrollador && (
        <ProtectedRoute allowedRoles={['administrativo']}>
          <div className="glass-card admin-dashboard-card" style={{ marginBottom: '2rem' }}>
            <div className="card-header">
              <h2 className="card-title" style={{ color: 'var(--primary)' }}>
                <ShieldAlert size={22} />
                Panel de Gestión y Monitoreo Administrativo (Nivel 2)
              </h2>
              <span className="admin-status-tag">Supervisión / Lectura</span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Visualización de perfiles y auditoría de actividad en los sistemas simulados (tienda y comida). Las acciones destructivas están restringidas al nivel Desarrollador.
            </p>

            <div className="admin-grid-features">
              <div className="admin-feature-box">
                <div className="feature-icon">
                  <Database size={20} color="var(--secondary)" />
                </div>
                <div>
                  <h4>Base de Datos Supabase</h4>
                  <p>Lectura activa de perfiles de usuario</p>
                </div>
              </div>

              <div className="admin-feature-box">
                <div className="feature-icon">
                  <Activity size={20} color="#818cf8" />
                </div>
                <div>
                  <h4>Auditoría de Actividad</h4>
                  <p>{auditLogs.length} eventos auditados</p>
                </div>
              </div>

              <div className="admin-feature-box">
                <div className="feature-icon">
                  <Lock size={20} color="var(--text-muted)" />
                </div>
                <div>
                  <h4>Acciones Destructivas</h4>
                  <p>Restringidas a Desarrollador (Nivel 1)</p>
                </div>
              </div>
            </div>

            {auditLogs.length > 0 && (
              <div className="admin-audit-table" style={{ marginTop: '1.25rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Auditoría de actividad en tiempo real:
                </h4>
                <div className="table-wrapper">
                  <table className="sim-table">
                    <thead>
                      <tr>
                        <th>Hora</th>
                        <th>Usuario</th>
                        <th>Rol</th>
                        <th>Actividad</th>
                        <th>Detalle</th>
                        <th>Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id}>
                          <td>{log.fecha}</td>
                          <td>{log.usuario}</td>
                          <td><span className="role-level-pill">{log.rol}</span></td>
                          <td><span className="role-level-pill">{log.tipo}</span></td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{log.detalle}</td>
                          <td className="gain-positive">{formatCurrency(log.monto)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </ProtectedRoute>
      )}

      {/* Panel de Sistemas Simulados: submenú interno para elegir entre
          Música, Tienda y Comida, todos con datos de muestra. */}
      {activeSection === 'simulador' && (
        <div className="systems-panel">
          <div className="systems-subnav">
            {SISTEMAS.map((sistema) => {
              const Icon = sistema.icon;
              return (
                <button
                  key={sistema.id}
                  type="button"
                  className={`systems-subnav-tab ${activeSystem === sistema.id ? 'active' : ''}`}
                  onClick={() => setActiveSystem(sistema.id)}
                >
                  <Icon size={16} />
                  <span>{sistema.label}</span>
                </button>
              );
            })}
          </div>

          {activeSystem === 'musica' && <MusicPlayer />}
          {activeSystem === 'tienda' && <DigitalStore onActivity={registrarActividad} />}
          {activeSystem === 'comida' && <FoodMenu onActivity={registrarActividad} />}
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthGate />
      <PixelCatEasterEgg />
    </AuthProvider>
  );
}

function AuthGate() {
  const { user, loading, passwordRecovery } = useAuth();

  if (loading) {
    return (
      <div className="auth-wrapper">
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <RefreshCw size={28} className="spin" style={{ color: 'var(--primary)' }} />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
            Cargando sesión y jerarquía de roles...
          </p>
        </div>
      </div>
    );
  }

  // Si el usuario llegó desde el enlace de "olvidé mi contraseña", pedirle
  // primero que fije una nueva contraseña antes de entrar al simulador.
  if (passwordRecovery) {
    return <ResetPassword />;
  }

  // Si no está autenticado, mostrar pantalla de Login
  if (!user) {
    return <Login />;
  }

  // Si está autenticado, mostrar el panel según el rol
  return <SimuladorContent />;
}

export default App;
