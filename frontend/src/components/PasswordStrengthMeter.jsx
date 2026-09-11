import React, { useMemo } from 'react';

/**
 * Calcula qué tan segura es una contraseña en una escala de 0 a 4, con un
 * mensaje corto en español. No revisa nada contra una lista de contraseñas
 * filtradas (eso requeriría un servicio externo); solo evalúa longitud y
 * variedad de caracteres, que es lo que realmente puede medirse en el
 * navegador sin mandar la contraseña a ningún lado.
 *
 * @param {string} password
 * @returns {{ score: number, label: string, color: string }}
 */
export function evaluarSeguridad(password) {
  const pw = password || '';

  if (pw.length === 0) {
    return { score: 0, label: '', color: 'transparent' };
  }

  let puntos = 0;
  if (pw.length >= 8) puntos += 1;
  if (pw.length >= 12) puntos += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) puntos += 1;
  if (/\d/.test(pw)) puntos += 1;
  if (/[^A-Za-z0-9]/.test(pw)) puntos += 1;

  // Penaliza contraseñas muy cortas aunque tengan variedad de caracteres:
  // 8 caracteres es el mínimo que exige el sistema, así que nunca debería
  // marcarse como "fuerte" si no lo alcanza.
  if (pw.length < 8) puntos = Math.min(puntos, 1);

  const score = Math.max(0, Math.min(4, puntos));

  const niveles = [
    { label: 'Muy débil', color: '#ef4444' }, // rojo
    { label: 'Débil', color: '#f97316' },     // naranja
    { label: 'Aceptable', color: '#eab308' }, // amarillo
    { label: 'Fuerte', color: '#84cc16' },    // verde claro
    { label: 'Muy fuerte', color: '#22c55e' } // verde
  ];

  return { score, ...niveles[score] };
}

/**
 * Barra visual de seguridad de contraseña: roja cuando es insegura, verde
 * cuando es segura. Se usa junto a cualquier campo de "nueva contraseña"
 * (registro, recuperación, panel de administración).
 */
export const PasswordStrengthMeter = ({ password }) => {
  const { score, label, color } = useMemo(() => evaluarSeguridad(password), [password]);

  if (!password) return null;

  const porcentaje = (score / 4) * 100;

  return (
    <div style={{ marginTop: '0.4rem' }} aria-live="polite">
      <div
        style={{
          height: '6px',
          width: '100%',
          borderRadius: '999px',
          background: 'rgba(255,255,255,0.12)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${porcentaje}%`,
            background: color,
            borderRadius: '999px',
            transition: 'width 0.2s ease, background-color 0.2s ease'
          }}
        />
      </div>
      <span
        style={{
          fontSize: '0.75rem',
          color,
          display: 'block',
          marginTop: '0.25rem',
          fontWeight: 500
        }}
      >
        Seguridad: {label}
      </span>
    </div>
  );
};

export default PasswordStrengthMeter;
