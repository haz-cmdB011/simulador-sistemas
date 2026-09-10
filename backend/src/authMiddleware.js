const { supabase } = require('./supabaseClient');
const { supabaseAdmin } = require('./supabaseAdmin');

/**
 * Middleware que exige que la petición traiga un JWT válido de Supabase Auth
 * (header "Authorization: Bearer <token>") perteneciente a un usuario cuyo
 * rol en la tabla `perfiles` sea 'desarrollador'. Se usa para proteger las
 * rutas administrativas de gestión de usuarios y contraseñas.
 */
async function requireDesarrollador(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    if (!token) {
      return res.status(401).json({ error: 'Falta el token de autenticación (header Authorization).' });
    }

    if (!supabaseAdmin) {
      return res.status(503).json({
        error: 'El servicio administrativo no está configurado en el servidor. Falta SUPABASE_SERVICE_ROLE_KEY en Render.'
      });
    }

    // Verifica el JWT contra Supabase Auth y obtiene el usuario dueño del token.
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      console.error('[Auth Middleware] Falla al verificar token:', userError?.message, userError?.status);
      return res.status(401).json({
        error: 'Token inválido o expirado. Vuelve a iniciar sesión.',
        details: userError?.message || 'Sin usuario en la respuesta de Supabase.'
      });
    }

    // Consulta el rol real en la tabla perfiles (usando el cliente admin para
    // evitar cualquier fricción con RLS al validar permisos).
    const { data: perfil, error: perfilError } = await supabaseAdmin
      .from('perfiles')
      .select('rol')
      .eq('id', userData.user.id)
      .single();

    if (perfilError || perfil?.rol !== 'desarrollador') {
      return res.status(403).json({
        error: 'Acceso restringido: esta acción requiere el rol Desarrollador.',
        details: perfilError?.message
      });
    }

    req.authUser = userData.user;
    next();
  } catch (err) {
    console.error('[Auth Middleware] Error inesperado:', err.message);
    return res.status(500).json({ error: 'Error interno al verificar la autenticación.' });
  }
}

module.exports = { requireDesarrollador };
