require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Cliente administrativo de Supabase: usa la Service Role Key, que puede
// saltarse RLS y administrar usuarios de Auth (crear, listar, cambiar
// contraseñas, etc). NUNCA debe usarse en el frontend ni exponerse al
// cliente — solo vive aquí, en el backend, leída desde una variable de
// entorno que se configura directamente en el panel de Render.
const rawUrl = process.env.SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin = null;

if (supabaseUrl && serviceRoleKey) {
  supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  console.log('[Supabase Admin] Cliente administrativo inicializado correctamente.');
} else {
  console.warn(
    '[Supabase Admin] Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno. ' +
    'Las rutas /api/admin/* quedarán deshabilitadas hasta que se configuren en Render.'
  );
}

module.exports = { supabaseAdmin };
