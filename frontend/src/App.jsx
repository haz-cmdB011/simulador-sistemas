import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import ResetPassword from './components/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';
import AdminUserManager from './components/AdminUserManager';
import { 
  TrendingUp, 
  DollarSign, 
  Percent, 
  Calendar, 
  Layers, 
  Activity, 
  ArrowUpRight, 
  Sparkles, 
  RefreshCw,
  AlertCircle,
  PiggyBank,
  CheckCircle2,
  Table,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  User as UserIcon,
  Sliders,
  Database,
  Terminal,
  Trash2,
  Lock,
  Flame
} from 'lucide-react';

const API_URL = "https://simulador-backend-pt4w.onrender.com";

function SimuladorContent() {
  const { user, logout, hasRole, isDesarrollador, isAdministrativo, canDelete, canEditCritical } = useAuth();

  const [formData, setFormData] = useState({
    inversionInicial: 5000,
    tasaInteres: 8, // Expresado en % para el usuario
    periodos: 12,
    tipo: 'compuesto',
    aportacionMensual: 200
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [serverOnline, setServerOnline] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [notification, setNotification] = useState(null);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTipoChange = (tipo) => {
    setFormData((prev) => ({ ...prev, tipo }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        inversionInicial: Number(formData.inversionInicial),
        tasaInteres: Number(formData.tasaInteres) / 100,
        periodos: Number(formData.periodos),
        tipo: formData.tipo,
        aportacionMensual: Number(formData.aportacionMensual || 0)
      };

      const response = await fetch(`${API_URL}/api/simular`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al procesar la simulación');
      }

      setResultado(data.data);
      setServerOnline(true);

      // Registrar en bitácora de auditoría para niveles administrativos y desarrollador
      if (isAdministrativo) {
        setAuditLogs((prev) => [
          {
            id: Date.now(),
            fecha: new Date().toLocaleTimeString(),
            usuario: user.email,
            rol: user.rol,
            monto: data.data.resumen.montoFinal,
            tipo: formData.tipo,
            inversion: data.data.resumen.inversionTotal
          },
          ...prev.slice(0, 19)
        ]);
      }
    } catch (err) {
      console.error('Error al simular:', err);
      setError(
        err.message.includes('Failed to fetch')
          ? 'No se pudo conectar con el servidor backend en Render. Asegúrate de que esté activo.'
          : err.message
      );
    } finally {
      setLoading(false);
    }
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

  // Acción destructiva: Restablecer valores de prueba (Exclusivo Desarrollador)
  const handleResetTestDatabase = () => {
    if (!canDelete) {
      showNotification('Acción bloqueada: Permiso reservado exclusivamente para Desarrollador.', 'error');
      return;
    }
    if (window.confirm('¿Confirmas restablecer el estado del simulador a los valores predeterminados?')) {
      setFormData({
        inversionInicial: 1000,
        tasaInteres: 5,
        periodos: 12,
        tipo: 'compuesto',
        aportacionMensual: 0
      });
      setAuditLogs([]);
      showNotification('Estado del sistema restablecido por el Desarrollador.', 'success');
    }
  };

  // Simulación inicial automática al cargar
  useEffect(() => {
    handleSubmit();
  }, []);

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
          <div className="user-avatar">
            {user?.nombre?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <div className="user-name-row">
              <span className="user-display-name">{user?.nombre}</span>
              {getRoleBadge()}
            </div>
            <span className="user-email-text">{user?.email}</span>
          </div>
        </div>

        <div className="user-actions">
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
                ? 'Consola de Operaciones y Captura de Simulaciones'
                : 'Simulación y cálculo de proyecciones financieras'}
            </p>
          </div>
        </div>
      </header>

      {/* Panel Exclusivo para Desarrollador (Nivel 1) */}
      {isDesarrollador && (
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
                  <p>Control de lectura, escritura y depuración en <code>simulaciones</code></p>
                </div>
              </div>

              <div className="admin-feature-box dev-box">
                <div className="feature-icon">
                  <Sliders size={20} color="var(--secondary)" />
                </div>
                <div>
                  <h4>Edición de Parámetros Críticos</h4>
                  <p>Ajuste maestro de algoritmos y tasas</p>
                </div>
              </div>

              <div className="admin-feature-box dev-box">
                <div className="feature-icon">
                  <Activity size={20} color="var(--accent)" />
                </div>
                <div>
                  <h4>Auditoría de Cálculos</h4>
                  <p>{auditLogs.length} simulaciones registradas</p>
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
                  title="Eliminar todas las simulaciones de la bitácora"
                >
                  <Trash2 size={15} />
                  <span>Vaciar Bitácora ({auditLogs.length})</span>
                </button>
                <button
                  type="button"
                  className="btn-destructive-secondary"
                  onClick={handleResetTestDatabase}
                  title="Restablecer el simulador a los valores originales"
                >
                  <RefreshCw size={15} />
                  <span>Restablecer Parámetros</span>
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
                        <th>Tipo</th>
                        <th>Monto Final</th>
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

      {/* Gestión de contraseñas de usuarios (Exclusivo Desarrollador) */}
      {isDesarrollador && (
        <ProtectedRoute allowedRoles={['desarrollador']}>
          <AdminUserManager />
        </ProtectedRoute>
      )}

      {/* Panel para Administrativo (Nivel 2) - Modo Supervisión y Lectura */}
      {hasRole('administrativo') && !isDesarrollador && (
        <ProtectedRoute allowedRoles={['administrativo']}>
          <div className="glass-card admin-dashboard-card" style={{ marginBottom: '2rem' }}>
            <div className="card-header">
              <h2 className="card-title" style={{ color: '#818cf8' }}>
                <ShieldAlert size={22} />
                Panel de Gestión y Monitoreo Administrativo (Nivel 2)
              </h2>
              <span className="admin-status-tag">Supervisión / Lectura</span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Visualización de perfiles y auditoría de cálculos. Las acciones destructivas están restringidas al nivel Desarrollador.
            </p>

            <div className="admin-grid-features">
              <div className="admin-feature-box">
                <div className="feature-icon">
                  <Database size={20} color="var(--secondary)" />
                </div>
                <div>
                  <h4>Base de Datos Supabase</h4>
                  <p>Lectura activa de tabla <code>simulaciones</code></p>
                </div>
              </div>

              <div className="admin-feature-box">
                <div className="feature-icon">
                  <Activity size={20} color="#818cf8" />
                </div>
                <div>
                  <h4>Auditoría de Actividad</h4>
                  <p>{auditLogs.length} cálculos auditados</p>
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
                  Auditoría de cálculos en tiempo real:
                </h4>
                <div className="table-wrapper">
                  <table className="sim-table">
                    <thead>
                      <tr>
                        <th>Hora</th>
                        <th>Usuario</th>
                        <th>Rol</th>
                        <th>Tipo</th>
                        <th>Monto Final</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id}>
                          <td>{log.fecha}</td>
                          <td>{log.usuario}</td>
                          <td><span className="role-level-pill">{log.rol}</span></td>
                          <td><span className="role-level-pill">{log.tipo}</span></td>
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

      {/* Main Simulator Grid */}
      <div className="main-grid">
        {/* Formulario */}
        <div className="glass-card">
          <div className="card-header">
            <h2 className="card-title">
              <Sparkles size={20} color="var(--primary-light)" />
              Parámetros de Simulación
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="sim-form">
            {/* Inversión Inicial */}
            <div className="form-group">
              <label className="form-label" htmlFor="inversionInicial">
                <span>Inversión Inicial</span>
                <span className="form-hint">Monto de partida</span>
              </label>
              <div className="input-wrapper">
                <DollarSign size={18} className="input-icon" />
                <input
                  id="inversionInicial"
                  name="inversionInicial"
                  type="number"
                  min="0"
                  step="100"
                  className="form-input"
                  value={formData.inversionInicial}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Aportación Mensual */}
            <div className="form-group">
              <label className="form-label" htmlFor="aportacionMensual">
                <span>Aportación Periódica</span>
                <span className="form-hint">Opcional por período</span>
              </label>
              <div className="input-wrapper">
                <PiggyBank size={18} className="input-icon" />
                <input
                  id="aportacionMensual"
                  name="aportacionMensual"
                  type="number"
                  min="0"
                  step="50"
                  className="form-input"
                  value={formData.aportacionMensual}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Tasa de Interés */}
            <div className="form-group">
              <label className="form-label" htmlFor="tasaInteres">
                <span>Tasa de Interés (%)</span>
                <span className="form-hint">Ejemplo: 8%</span>
              </label>
              <div className="input-wrapper">
                <Percent size={18} className="input-icon" />
                <input
                  id="tasaInteres"
                  name="tasaInteres"
                  type="number"
                  min="0"
                  max="1000"
                  step="0.1"
                  className="form-input"
                  value={formData.tasaInteres}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Períodos */}
            <div className="form-group">
              <label className="form-label" htmlFor="periodos">
                <span>Número de Períodos</span>
                <span className="form-hint">Meses / Ciclos</span>
              </label>
              <div className="input-wrapper">
                <Calendar size={18} className="input-icon" />
                <input
                  id="periodos"
                  name="periodos"
                  type="number"
                  min="1"
                  max="120"
                  className="form-input"
                  value={formData.periodos}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Sistema / Tipo de Interés */}
            <div className="form-group">
              <label className="form-label">
                <span>Tipo de Cálculo</span>
              </label>
              <div className="system-toggle">
                <button
                  type="button"
                  className={`toggle-btn ${formData.tipo === 'compuesto' ? 'active' : ''}`}
                  onClick={() => handleTipoChange('compuesto')}
                >
                  Compuesto
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${formData.tipo === 'simple' ? 'active' : ''}`}
                  onClick={() => handleTipoChange('simple')}
                >
                  Simple
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw size={18} className="spin" />
                  Calculando...
                </>
              ) : (
                <>
                  <Activity size={18} />
                  Calcular Simulación
                </>
              )}
            </button>
          </form>
        </div>

        {/* Sección de Resultados */}
        <div className="results-container">
          {error && (
            <div className="error-banner">
              <AlertCircle size={20} />
              <div>
                <strong>Error en la petición:</strong> {error}
              </div>
            </div>
          )}

          {resultado ? (
            <>
              {/* KPIs */}
              <div className="stats-grid">
                <div className="stat-card" style={{ '--card-accent': 'var(--secondary)' }}>
                  <div className="stat-label">Inversión Total</div>
                  <div className="stat-value">
                    {formatCurrency(resultado.resumen.inversionTotal)}
                  </div>
                  <div className="stat-badge" style={{ color: 'var(--secondary)' }}>
                    <Layers size={13} /> Capital aportado
                  </div>
                </div>

                <div className="stat-card" style={{ '--card-accent': 'var(--accent)' }}>
                  <div className="stat-label">Intereses Generados</div>
                  <div className="stat-value" style={{ color: 'var(--accent)' }}>
                    +{formatCurrency(resultado.resumen.totalIntereses)}
                  </div>
                  <div className="stat-badge">
                    <ArrowUpRight size={13} /> Ganancia neta
                  </div>
                </div>

                <div className="stat-card" style={{ '--card-accent': 'var(--primary-light)' }}>
                  <div className="stat-label">Monto Final Proyectado</div>
                  <div className="stat-value" style={{ color: '#ffffff' }}>
                    {formatCurrency(resultado.resumen.montoFinal)}
                  </div>
                  <div className="stat-badge" style={{ color: 'var(--primary-light)' }}>
                    <CheckCircle2 size={13} /> Saldo acumulado
                  </div>
                </div>

                <div className="stat-card" style={{ '--card-accent': 'var(--warning)' }}>
                  <div className="stat-label">Rendimiento Total</div>
                  <div className="stat-value" style={{ color: 'var(--warning)' }}>
                    {resultado.resumen.gananciaPorcentual}%
                  </div>
                  <div className="stat-badge" style={{ color: 'var(--warning)' }}>
                    <Percent size={13} /> ROI acumulado
                  </div>
                </div>
              </div>

              {/* Barra de Proporción Capital vs Interés */}
              <div className="progress-card">
                <div className="progress-header">
                  <span>Composición del Capital Final</span>
                  <span>{formatCurrency(resultado.resumen.montoFinal)}</span>
                </div>
                <div className="progress-bar-track">
                  <div
                    className="progress-bar-fill-initial"
                    style={{
                      width: `${Math.min(
                        100,
                        (resultado.resumen.inversionTotal / resultado.resumen.montoFinal) * 100
                      )}%`
                    }}
                    title={`Capital Aportado: ${formatCurrency(resultado.resumen.inversionTotal)}`}
                  />
                  <div
                    className="progress-bar-fill-interest"
                    style={{
                      width: `${Math.min(
                        100,
                        (resultado.resumen.totalIntereses / resultado.resumen.montoFinal) * 100
                      )}%`
                    }}
                    title={`Intereses: ${formatCurrency(resultado.resumen.totalIntereses)}`}
                  />
                </div>
                <div className="progress-legend">
                  <div className="legend-item">
                    <div className="legend-dot" style={{ backgroundColor: 'var(--secondary)' }} />
                    <span>
                      Capital Aportado ({((resultado.resumen.inversionTotal / resultado.resumen.montoFinal) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ backgroundColor: 'var(--accent)' }} />
                    <span>
                      Intereses ({((resultado.resumen.totalIntereses / resultado.resumen.montoFinal) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabla de Desglose */}
              <div className="glass-card">
                <div className="card-header">
                  <h3 className="card-title">
                    <Table size={18} color="var(--primary-light)" />
                    Desglose por Período ({resultado.desglose.length} ciclos)
                  </h3>
                </div>

                <div className="table-wrapper">
                  <table className="sim-table">
                    <thead>
                      <tr>
                        <th>Período</th>
                        <th>Aportación</th>
                        <th>Interés Generado</th>
                        <th>Saldo Acumulado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultado.desglose.map((fila) => (
                        <tr key={fila.periodo}>
                          <td><strong>Ciclo #{fila.periodo}</strong></td>
                          <td className="num-cell">{formatCurrency(fila.aportacion)}</td>
                          <td className="num-cell gain-positive">+{formatCurrency(fila.interesGanado)}</td>
                          <td className="num-cell" style={{ fontWeight: 600 }}>
                            {formatCurrency(fila.saldoFinal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            !loading && (
              <div className="glass-card empty-state">
                <div className="empty-icon">
                  <Activity size={32} />
                </div>
                <h3>Sin resultados todavía</h3>
                <p>Ingresa los parámetros y haz clic en "Calcular Simulación" para ver la proyección.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthGate />
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
