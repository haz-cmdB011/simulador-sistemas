import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, SkipBack, SkipForward, Heart, Volume2, VolumeX, Music2, ListMusic } from 'lucide-react';

// Datos de muestra: no hay conexión real a la API de Spotify (se decidió a
// propósito reproducir de forma simulada, sin depender de cuentas ni claves
// externas). La duración de cada pista es real en segundos, así que la
// barra de progreso avanza al mismo ritmo que duraría la canción de verdad.
const LISTAS = [
  {
    id: 'para-ti',
    nombre: 'Para Ti',
    canciones: [
      { id: 1, titulo: 'Horizonte Azul', artista: 'Mar Adentro', duracion: 214, color: '#2997ff' },
      { id: 2, titulo: 'Luces de la Ciudad', artista: 'Nocturno', duracion: 187, color: '#5e5ce6' },
      { id: 3, titulo: 'Vuelo Nocturno', artista: 'Aeris', duracion: 201, color: '#db2777' },
      { id: 4, titulo: 'Vientos del Sur', artista: 'Cardamomo', duracion: 176, color: '#34c759' },
      { id: 5, titulo: 'Reflejos', artista: 'Mar Adentro', duracion: 232, color: '#ff9500' }
    ]
  },
  {
    id: 'top-hits',
    nombre: 'Top Hits',
    canciones: [
      { id: 6, titulo: 'Sube el Volumen', artista: 'Fuego Nuevo', duracion: 198, color: '#ff3b30' },
      { id: 7, titulo: 'Corazón de Neón', artista: 'Pixel Dreams', duracion: 205, color: '#2997ff' },
      { id: 8, titulo: 'Bajo la Lluvia', artista: 'Nocturno', duracion: 190, color: '#5e5ce6' },
      { id: 9, titulo: 'Doble Sentido', artista: 'Cardamomo', duracion: 221, color: '#34c759' }
    ]
  },
  {
    id: 'chill',
    nombre: 'Chill',
    canciones: [
      { id: 10, titulo: 'Café y Silencio', artista: 'Aeris', duracion: 240, color: '#ff9500' },
      { id: 11, titulo: 'Atardecer Lento', artista: 'Mar Adentro', duracion: 256, color: '#db2777' },
      { id: 12, titulo: 'Respirar', artista: 'Pixel Dreams', duracion: 183, color: '#34c759' }
    ]
  }
];

const formatearTiempo = (segundos) => {
  const m = Math.floor(segundos / 60);
  const s = Math.floor(segundos % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

export const MusicPlayer = () => {
  const [listaActivaId, setListaActivaId] = useState(LISTAS[0].id);
  const [cancionActualId, setCancionActualId] = useState(LISTAS[0].canciones[0].id);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [volumen, setVolumen] = useState(70);
  const [favoritas, setFavoritas] = useState(new Set());
  const intervaloRef = useRef(null);

  const todasLasCanciones = useMemo(() => LISTAS.flatMap((l) => l.canciones), []);
  const listaActiva = LISTAS.find((l) => l.id === listaActivaId) || LISTAS[0];
  const cancionActual = todasLasCanciones.find((c) => c.id === cancionActualId) || todasLasCanciones[0];

  const irASiguiente = () => {
    const idx = listaActiva.canciones.findIndex((c) => c.id === cancionActualId);
    const siguiente = listaActiva.canciones[(idx + 1) % listaActiva.canciones.length];
    setCancionActualId(siguiente.id);
    setProgreso(0);
  };

  const irAAnterior = () => {
    const idx = listaActiva.canciones.findIndex((c) => c.id === cancionActualId);
    const anterior = listaActiva.canciones[(idx - 1 + listaActiva.canciones.length) % listaActiva.canciones.length];
    setCancionActualId(anterior.id);
    setProgreso(0);
  };

  // "Reproducción" simulada: mientras está en play, el progreso avanza un
  // segundo por segundo real hasta llegar a la duración de la canción, y ahí
  // pasa sola a la siguiente — igual que un reproductor de verdad, sin
  // necesidad de un archivo de audio real de por medio.
  useEffect(() => {
    if (!reproduciendo) {
      clearInterval(intervaloRef.current);
      return;
    }
    intervaloRef.current = setInterval(() => {
      setProgreso((prev) => {
        if (prev + 1 >= cancionActual.duracion) {
          irASiguiente();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(intervaloRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reproduciendo, cancionActualId]);

  const seleccionarCancion = (cancion, listaId) => {
    if (listaId) setListaActivaId(listaId);
    setCancionActualId(cancion.id);
    setProgreso(0);
    setReproduciendo(true);
  };

  const alternarFavorita = (id) => {
    setFavoritas((prev) => {
      const copia = new Set(prev);
      copia.has(id) ? copia.delete(id) : copia.add(id);
      return copia;
    });
  };

  const porcentaje = Math.min(100, (progreso / cancionActual.duracion) * 100);

  return (
    <div className="music-player">
      <div className="music-player-layout">
        <div className="glass-card music-playlist-card">
          <div className="card-header">
            <h2 className="card-title">
              <ListMusic size={20} color="var(--primary-light)" />
              Reproductor de Música
            </h2>
            <span className="music-simulated-tag">Reproducción simulada</span>
          </div>

          <div className="music-playlist-tabs">
            {LISTAS.map((lista) => (
              <button
                key={lista.id}
                type="button"
                className={`music-playlist-tab ${lista.id === listaActivaId ? 'active' : ''}`}
                onClick={() => setListaActivaId(lista.id)}
              >
                {lista.nombre}
              </button>
            ))}
          </div>

          <div className="music-track-list">
            {listaActiva.canciones.map((cancion) => {
              const esActual = cancion.id === cancionActualId;
              return (
                <div
                  key={cancion.id}
                  className={`music-track-row ${esActual ? 'active' : ''}`}
                  onClick={() => seleccionarCancion(cancion, listaActiva.id)}
                >
                  <div className="music-track-art" style={{ background: cancion.color }}>
                    {esActual && reproduciendo ? (
                      <span className="music-eq">
                        <span /><span /><span />
                      </span>
                    ) : (
                      <Music2 size={15} color="rgba(255,255,255,0.85)" />
                    )}
                  </div>
                  <div className="music-track-info">
                    <span className="music-track-title">{cancion.titulo}</span>
                    <span className="music-track-artist">{cancion.artista}</span>
                  </div>
                  <button
                    type="button"
                    className={`music-like-btn ${favoritas.has(cancion.id) ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      alternarFavorita(cancion.id);
                    }}
                    title="Me gusta"
                  >
                    <Heart size={15} fill={favoritas.has(cancion.id) ? 'currentColor' : 'none'} />
                  </button>
                  <span className="music-track-duration">{formatearTiempo(cancion.duracion)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Barra de reproducción actual, fija al pie del panel */}
      <div className="glass-card music-now-playing">
        <div className="music-track-art music-now-art" style={{ background: cancionActual.color }}>
          <Music2 size={20} color="rgba(255,255,255,0.9)" />
        </div>

        <div className="music-now-info">
          <span className="music-track-title">{cancionActual.titulo}</span>
          <span className="music-track-artist">{cancionActual.artista}</span>
        </div>

        <div className="music-now-controls">
          <div className="music-transport">
            <button type="button" onClick={irAAnterior} title="Anterior">
              <SkipBack size={17} />
            </button>
            <button type="button" className="music-play-btn" onClick={() => setReproduciendo((v) => !v)}>
              {reproduciendo ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
            </button>
            <button type="button" onClick={irASiguiente} title="Siguiente">
              <SkipForward size={17} />
            </button>
          </div>

          <div className="music-progress-row">
            <span className="music-time">{formatearTiempo(progreso)}</span>
            <div
              className="music-progress-track"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = (e.clientX - rect.left) / rect.width;
                setProgreso(Math.round(ratio * cancionActual.duracion));
              }}
            >
              <div className="music-progress-fill" style={{ width: `${porcentaje}%` }} />
            </div>
            <span className="music-time">{formatearTiempo(cancionActual.duracion)}</span>
          </div>
        </div>

        <div className="music-volume">
          {volumen === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          <input
            type="range"
            min="0"
            max="100"
            value={volumen}
            onChange={(e) => setVolumen(Number(e.target.value))}
            className="music-volume-slider"
          />
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
