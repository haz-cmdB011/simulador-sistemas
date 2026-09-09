import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || 'https://opsdfefftzvhljjueljm.supabase.co';
// Normalizar URL (remover sufijo /rest/v1 si estuviera presente)
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXV';

let supabase = null;

try {
  if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('tu-proyecto') && !supabaseAnonKey.includes('tu-supabase-anon')) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }
} catch (err) {
  console.error('[Supabase Frontend] Error al inicializar cliente:', err.message);
}

export { supabase };
export default supabase;
