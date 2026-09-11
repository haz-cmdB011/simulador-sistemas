import { createClient } from '@supabase/supabase-js';

const rawUrl = 'https://opsdfefftzvhljjueljm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc2RmZWZmdHp2aGxqanVlbGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4ODEzOTgsImV4cCI6MjEwNDQ1NzM5OH0.qD9v39_149Gp9TJyCEVnm3FlbRPMutzLz0c3qm8dJpY';

// Limpia automáticamente slashes finales o rutas tipo /rest/v1
const supabaseUrl = rawUrl.trim().replace(/\/+$/, '').replace(/\/rest\/v1.*$/, '');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Guarda la sesión en sessionStorage en vez de localStorage: localStorage
    // sobrevive a cerrar la pestaña/navegador (por eso la sesión "se quedaba
    // guardada"), mientras que sessionStorage se borra automáticamente en
    // cuanto se cierra la pestaña, y con ella la sesión de Supabase. Recargar
    // la página (F5) sigue funcionando normal, solo cerrar la pestaña cierra
    // la sesión.
    storage: window.sessionStorage,
    persistSession: true,
    autoRefreshToken: true
  }
});

export default supabase;
