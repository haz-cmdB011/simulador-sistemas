import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

const LONGITUD_MINIMA_PASSWORD = 8;

/**
 * Se muestra cuando el usuario llega a la app desde el enlace de recuperación
 * de contraseña ("Olvidé mi contraseña") enviado por Supabase. Le permite
 * fijar una contraseña nueva antes de continuar al simulador.
 */
export const ResetPassword = () => {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < LONGITUD_MINIMA_PASSWORD) {
      setError(`La contraseña debe tener al menos ${LONGITUD_MINIMA_PASSWORD} caracteres.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
    } catch (err) {
      console.error('[Auth Error]', err);
      setError(err.message || 'No se pudo actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card glass-card">
        <div className="auth-header">
          <div className="brand-icon">
            <KeyRound size={28} />
          </div>
          <h1 className="brand-title">Nueva Contraseña</h1>
          <p className="brand-subtitle">Elige una contraseña nueva para tu cuenta</p>
        </div>

        {error && (
          <div className="error-banner" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="sim-form">
          <div className="form-group">
            <label className="form-label" htmlFor="new-password">
              Nueva Contraseña
            </label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="new-password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={LONGITUD_MINIMA_PASSWORD}
              />
            </div>
            <PasswordStrengthMeter password={password} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirm-password">
              Confirmar Contraseña
            </label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="confirm-password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={LONGITUD_MINIMA_PASSWORD}
              />
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? (
              <span>Actualizando...</span>
            ) : (
              <>
                <span>Guardar nueva contraseña</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
