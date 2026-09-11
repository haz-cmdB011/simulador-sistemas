// Sistema de personalización de color. En vez de tener los colores del
// vidrio (los "blobs" de fondo) y el color de acento fijos en el CSS, se
// guardan como variables CSS que este módulo puede reescribir en caliente
// desde el panel de personalización, y persiste la elección del usuario en
// localStorage para que se mantenga entre sesiones.

const STORAGE_KEY = 'simulador_theme_v1';

export const DEFAULT_THEME = {
  primary: '#0071e3',
  secondary: '#5e5ce6',
  accent: '#34c759',
  blob1: '#2997ff',
  blob2: '#5e5ce6',
  blob3: '#34c759',
  blob4: '#ff9500',
  blob5: '#db2777'
};

// Paletas predefinidas de un clic, pensadas para que el vidrio siempre se
// vea bien (colores suficientemente vivos y variados entre sí).
export const THEME_PRESETS = [
  { id: 'oceano', label: 'Océano', ...DEFAULT_THEME },
  {
    id: 'atardecer',
    label: 'Atardecer',
    primary: '#ff9500',
    secondary: '#ff3b30',
    accent: '#ffcc00',
    blob1: '#ff9500',
    blob2: '#ff3b30',
    blob3: '#db2777',
    blob4: '#ffcc00',
    blob5: '#ff6482'
  },
  {
    id: 'bosque',
    label: 'Bosque',
    primary: '#248a3d',
    secondary: '#30b0c7',
    accent: '#34c759',
    blob1: '#34c759',
    blob2: '#30b0c7',
    blob3: '#248a3d',
    blob4: '#a8e063',
    blob5: '#00c7be'
  },
  {
    id: 'candy',
    label: 'Candy',
    primary: '#bf5af2',
    secondary: '#ff375f',
    accent: '#5e5ce6',
    blob1: '#bf5af2',
    blob2: '#ff375f',
    blob3: '#5e5ce6',
    blob4: '#ff9ff3',
    blob5: '#64d2ff'
  },
  {
    id: 'grafito',
    label: 'Grafito',
    primary: '#1d1d1f',
    secondary: '#6e6e73',
    accent: '#0071e3',
    blob1: '#8e8e93',
    blob2: '#aeaeb2',
    blob3: '#0071e3',
    blob4: '#636366',
    blob5: '#48484a'
  }
];

const VAR_MAP = {
  primary: '--primary',
  secondary: '--secondary',
  accent: '--accent',
  blob1: '--blob-1',
  blob2: '--blob-2',
  blob3: '--blob-3',
  blob4: '--blob-4',
  blob5: '--blob-5'
};

// El resto de la paleta (hover, glow, luz) se deriva de primary/secondary/
// accent para no tener que pedirle 15 colores al usuario. Usa color-mix,
// soportado en los navegadores modernos.
function applyDerivedVars(root, theme) {
  root.style.setProperty('--primary-hover', `color-mix(in srgb, ${theme.primary} 85%, black)`);
  root.style.setProperty('--primary-light', `color-mix(in srgb, ${theme.primary} 75%, white)`);
  root.style.setProperty('--primary-glow', `color-mix(in srgb, ${theme.primary} 22%, transparent)`);
  root.style.setProperty('--secondary-hover', `color-mix(in srgb, ${theme.secondary} 85%, black)`);
  root.style.setProperty('--accent-glow', `color-mix(in srgb, ${theme.accent} 20%, transparent)`);
  root.style.setProperty('--border-focus', theme.primary);
  root.style.setProperty('--border-glow', `color-mix(in srgb, ${theme.primary} 20%, transparent)`);
}

export function applyTheme(theme) {
  const root = document.documentElement;
  Object.entries(VAR_MAP).forEach(([key, cssVar]) => {
    if (theme[key]) root.style.setProperty(cssVar, theme[key]);
  });
  applyDerivedVars(root, { ...DEFAULT_THEME, ...theme });
}

export function loadTheme() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_THEME;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_THEME, ...parsed };
  } catch {
    return DEFAULT_THEME;
  }
}

export function saveTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
  } catch {
    // localStorage no disponible (modo privado, etc.) — no es crítico,
    // el tema simplemente no persistirá entre sesiones.
  }
}
