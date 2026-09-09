import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

/**
 * Traduce los mensajes de error de Supabase Auth a español con instrucciones claras.
 * @param {Error} error - Objeto de error de Supabase
 * @returns {string} Mensaje de error en español
 */
const getErrorMessage = (error) => {
  const msg = (error.message || '').toLowerCase();

  if (msg.includes('invalid login credentials')) {
    return 'Credenciales inválidas: el correo o la contraseña son incorrectos, o el usuario no existe en este proyecto. Verifica tus datos o regístrate primero.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Tu cuenta aún no ha sido confirmada. Revisa tu bandeja de correo (incluyendo spam) para el enlace de verificación de Supabase.';
  }
  if (msg.includes('user not found')) {
    return 'No se encontró ninguna cuenta con ese correo electrónico. ¿Necesitas registrarte primero?';
  }
  if (msg.includes('invalid api key') || msg.includes('apikey')) {
    return 'Error de configuración del sistema (API Key inválida). Contacta al administrador.';
  }
  if (msg.includes('signup is disabled')) {
    return 'El registro de nuevas cuentas está deshabilitado en este momento. Contacta al administrador.';
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Demasiados intentos. Espera unos segundos antes de volver a intentar.';
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'No se pudo conectar con el servidor de autenticación. Verifica tu conexión a internet.';
  }
  if (msg.includes('password') && msg.includes('at least')) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (msg.includes('already registered') || msg.includes('already been registered')) {
    return 'Este correo electrónico ya está registrado. Intenta iniciar sesión en su lugar.';
  }

  // Fallback: devuelve el mensaje original si no hay traducción
  return error.message || 'Error de autenticación con Supabase.';
};

export const Login = () => {
  const { login, signUp } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!nombre.trim()) {
          throw new Error('Por favor ingresa tu nombre completo.');
        }
        const res = await signUp(email, password, nombre);
        if (res?.data?.user && !res?.data?.session) {
          const msg = 'Registro creado exitosamente en Supabase. Si la confirmación de correo está activada, revisa tu correo para verificar tu cuenta; de lo contrario, puedes iniciar sesión.';
          setSuccessMsg(msg);
          alert(msg);
          setIsRegister(false);
        }
      } else {
        await login(email, password);
      }
    } catch (err) {
      console.error('[Auth Error]', err);
      const msg = getErrorMessage(err);
      setError(msg);
      alert(`Error: ${msg}`);
    } finally {
      setLoading(false);
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
            {isRegister ? 'Crea tu cuenta oficial en la plataforma' : 'Accede con tu cuenta de Supabase'}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${!isRegister ? 'active' : ''}`}
            onClick={() => { setIsRegister(false); setError(null); setSuccessMsg(null); }}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            className={`auth-tab ${isRegister ? 'active' : ''}`}
            onClick={() => { setIsRegister(true); setError(null); setSuccessMsg(null); }}
          >
            Registrarse
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="notification-toast success" style={{ position: 'static', marginBottom: '1.25rem', width: '100%', animation: 'none' }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

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

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? (
              <span>Conectando con Supabase...</span>
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
