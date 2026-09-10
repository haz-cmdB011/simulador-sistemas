import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  Lock,
  Mail,
  User,
  ArrowRight,
  ArrowLeft,
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
  const { login, signUp, resetPassword } = useAuth();
  // 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const isRegister = mode === 'register';
  const isForgot = mode === 'forgot';

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isForgot) {
        await resetPassword(email);
        const msg = `Si ${email.trim()} tiene una cuenta registrada, te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada (y spam).`;
        setSuccessMsg(msg);
      } else if (isRegister) {
        if (!nombre.trim()) {
          throw new Error('Por favor ingresa tu nombre completo.');
        }
        const res = await signUp(email, password, nombre);
        if (res?.data?.user && !res?.data?.session) {
          const msg = 'Registro creado exitosamente en Supabase. Si la confirmación de correo está activada, revisa tu correo para verificar tu cuenta; de lo contrario, puedes iniciar sesión.';
          setSuccessMsg(msg);
          alert(msg);
          switchMode('login');
        }
      } else {
        await login(email, password);
      }
    } catch (err) {
      console.error('[Auth Error]', err);
      const msg = getErrorMessage(err);
      setError(msg);
      if (!isForgot) {
        alert(`Error: ${msg}`);
      }
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
            {isForgot
              ? 'Recupera el acceso a tu cuenta'
              : isRegister
              ? 'Crea tu cuenta oficial en la plataforma'
              : 'Accede con tu cuenta de Supabase'}
          </p>
        </div>

        {/* Tab Selector (oculto en el flujo de recuperación) */}
        {!isForgot && (
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${!isRegister ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              className={`auth-tab ${isRegister ? 'active' : ''}`}
              onClick={() => switchMode('register')}
            >
              Registrarse
            </button>
          </div>
        )}

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

          {!isForgot && (
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
          )}

          {!isForgot && !isRegister && (
            <button
              type="button"
              className="link-button"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                textAlign: 'right',
                cursor: 'pointer',
                padding: 0,
                marginTop: '-0.5rem'
              }}
              onClick={() => switchMode('forgot')}
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? (
              <span>{isForgot ? 'Enviando enlace...' : 'Conectando con Supabase...'}</span>
            ) : isForgot ? (
              <>
                <span>Enviar enlace de recuperación</span>
                <ArrowRight size={18} />
              </>
            ) : (
              <>
                <span>{isRegister ? 'Crear Cuenta' : 'Ingresar al Simulador'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {isForgot && (
            <button
              type="button"
              className="link-button"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer',
                padding: 0,
                justifyContent: 'center'
              }}
              onClick={() => switchMode('login')}
            >
              <ArrowLeft size={15} />
              <span>Volver a iniciar sesión</span>
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
