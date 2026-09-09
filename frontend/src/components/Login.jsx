import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, 
  Lock, 
  Mail, 
  User, 
  ShieldCheck, 
  ShieldAlert, 
  Terminal,
  ArrowRight, 
  AlertCircle
} from 'lucide-react';

export const Login = () => {
  const { login, signUp, rolesHierarchy } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('usuario');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!nombre.trim()) {
          throw new Error('Por favor ingresa tu nombre completo.');
        }
        await signUp(email, password, nombre, rol);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message || 'Error al autenticar');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (key) => {
    switch (key) {
      case 'desarrollador':
        return <Terminal size={16} color="var(--primary-light)" />;
      case 'administrativo':
        return <ShieldAlert size={16} color="#818cf8" />;
      case 'operador':
        return <ShieldCheck size={16} color="#06b6d4" />;
      default:
        return <User size={16} color="#10b981" />;
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card glass-card">
        {/* Brand Header */}
        <div className="auth-header">
          <div className="brand-icon">
            <TrendingUp size={28} />
          </div>
          <h1 className="brand-title">Simulador de Sistemas</h1>
          <p className="brand-subtitle">
            {isRegister ? 'Crea tu cuenta asignando el rol y nivel de jerarquía' : 'Accede a la plataforma de simulación'}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${!isRegister ? 'active' : ''}`}
            onClick={() => { setIsRegister(false); setError(null); }}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            className={`auth-tab ${isRegister ? 'active' : ''}`}
            onClick={() => { setIsRegister(true); setError(null); }}
          >
            Registrarse
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="error-banner" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="sim-form">
          {isRegister && (
            <div className="form-group">
              <label className="form-label" htmlFor="nombre">
                Nombre Completo
              </label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  id="nombre"
                  type="text"
                  className="form-input"
                  placeholder="Ej. Carlos Rodríguez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required={isRegister}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Correo Electrónico
            </label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Contraseña
            </label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {isRegister && (
            <div className="form-group">
              <label className="form-label">
                Rol de Usuario y Jerarquía
              </label>
              <div className="role-selector-grid">
                {Object.entries(rolesHierarchy).map(([key, info]) => (
                  <button
                    key={key}
                    type="button"
                    className={`role-option-btn ${rol === key ? 'active' : ''}`}
                    onClick={() => setRol(key)}
                    title={info.descripcion}
                  >
                    <div className="role-option-header">
                      {getRoleIcon(key)}
                      <span>{info.label}</span>
                    </div>
                    <span className="role-level-pill">Nivel {info.nivel}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? (
              <span>Procesando...</span>
            ) : (
              <>
                <span>{isRegister ? 'Crear Cuenta' : 'Ingresar al Simulador'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
