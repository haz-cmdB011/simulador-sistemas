import React, { useRef, useState } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MAX_DIMENSION = 400; // px — se reescala antes de subir, no hace falta más para un avatar
const JPEG_QUALITY = 0.85;

/**
 * Reescala la imagen elegida a un tamaño razonable para un avatar (lado
 * más largo = MAX_DIMENSION) y la comprime a JPEG, todo en el navegador
 * antes de subirla. Así una foto de 12MB de un celular no se manda entera
 * al servidor — se manda ya lista como avatar.
 */
function reescalarYComprimir(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('El archivo no es una imagen válida.'));
      img.onload = () => {
        const escala = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const ancho = Math.round(img.width * escala);
        const alto = Math.round(img.height * escala);

        const canvas = document.createElement('canvas');
        canvas.width = ancho;
        canvas.height = alto;
        const ctx = canvas.getContext('2d');
        // Fondo blanco por si la imagen original tenía transparencia (PNG),
        // ya que se exporta como JPEG y ese formato no soporta canal alfa.
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, ancho, alto);
        ctx.drawImage(img, 0, 0, ancho, alto);

        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Foto de perfil circular. Al hacer clic (sobre el propio avatar, en la
 * barra de sesión) abre el selector de archivos del sistema; al elegir una
 * imagen la reescala en el navegador y la sube al backend, que la guarda en
 * Supabase Storage y actualiza el perfil. Si ya hay foto, aparece un botón
 * pequeño para quitarla.
 */
export const AvatarUploader = ({ apiUrl }) => {
  const { user, setAvatarUrl } = useAuth();
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const abrirSelector = () => {
    if (subiendo) return;
    setError(null);
    inputRef.current?.click();
  };

  const manejarArchivo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite volver a elegir el mismo archivo después
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Elige un archivo de imagen (PNG, JPG o WEBP).');
      return;
    }

    setSubiendo(true);
    setError(null);
    try {
      const imagenBase64 = await reescalarYComprimir(file);

      const res = await fetch(`${apiUrl}/api/perfil/avatar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify({ imagenBase64 })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo subir la foto.');

      setAvatarUrl(data.avatarUrl);
    } catch (err) {
      console.error('[Avatar] Error al subir:', err);
      setError(err.message || 'No se pudo subir la foto.');
    } finally {
      setSubiendo(false);
    }
  };

  const quitarFoto = async (e) => {
    e.stopPropagation();
    if (subiendo) return;
    setSubiendo(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/api/perfil/avatar`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo quitar la foto.');
      setAvatarUrl(null);
    } catch (err) {
      console.error('[Avatar] Error al quitar:', err);
      setError(err.message || 'No se pudo quitar la foto.');
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="avatar-uploader">
      <button
        type="button"
        className="user-avatar avatar-uploader-btn"
        onClick={abrirSelector}
        title="Cambiar foto de perfil"
        disabled={subiendo}
      >
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt="Foto de perfil" className="avatar-uploader-img" />
        ) : (
          <span>{user?.nombre?.charAt(0).toUpperCase() || 'U'}</span>
        )}

        <span className="avatar-uploader-overlay">
          {subiendo ? <Loader2 size={14} className="spin" /> : <Camera size={14} />}
        </span>
      </button>

      {user?.avatarUrl && !subiendo && (
        <button
          type="button"
          className="avatar-uploader-remove"
          onClick={quitarFoto}
          title="Quitar foto de perfil"
        >
          <X size={10} />
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={manejarArchivo}
        style={{ display: 'none' }}
      />

      {error && <span className="avatar-uploader-error">{error}</span>}
    </div>
  );
};

export default AvatarUploader;
