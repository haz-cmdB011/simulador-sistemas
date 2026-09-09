import { createClient } from '@supabase/supabase-js';

// Variables de entorno de Supabase o credenciales directas de respaldo para producción
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://opsdfefftzvhljjueljm.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXV';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export default supabase;
