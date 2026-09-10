require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { supabase, guardarSimulacion } = require('./src/supabaseClient');
const { supabaseAdmin } = require('./src/supabaseAdmin');
const { requireDesarrollador } = require('./src/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta raíz
app.get('/', (req, res) => res.json({ status: 'OK', mensaje: 'API del Simulador funcionando' }));

// Ruta GET /api/health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor backend funcionando correctamente',
    supabaseConnected: !!supabase,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Ruta POST /api/simular
app.post('/api/simular', async (req, res) => {
  try {
    const {
      inversionInicial = 1000,
      tasaInteres = 0.05,
      periodos = 12,
      tipo = 'compuesto', // 'simple' o 'compuesto'
      aportacionMensual = 0
    } = req.body;

    const pInicial = Number(inversionInicial);
    const tasa = Number(tasaInteres);
    const nPeriodos = Number(periodos);
    const aportacion = Number(aportacionMensual);

    if (isNaN(pInicial) || isNaN(tasa) || isNaN(nPeriodos)) {
      return res.status(400).json({
        error: 'Parámetros inválidos. inversionInicial, tasaInteres y periodos deben ser numéricos.'
      });
    }

    const desglose = [];
    let saldoActual = pInicial;
    let totalInteresesGanados = 0;
    let totalAportaciones = 0;

    for (let i = 1; i <= nPeriodos; i++) {
      let interesPeriodo = 0;

      if (tipo === 'simple') {
        interesPeriodo = pInicial * tasa;
        saldoActual += interesPeriodo + aportacion;
      } else {
        // Interés compuesto
        interesPeriodo = saldoActual * tasa;
        saldoActual += interesPeriodo + aportacion;
      }

      totalInteresesGanados += interesPeriodo;
      totalAportaciones += aportacion;

      desglose.push({
        periodo: i,
        interesGanado: Number(interesPeriodo.toFixed(2)),
        aportacion: aportacion,
        saldoFinal: Number(saldoActual.toFixed(2))
      });
    }

    const resultado = {
      parametros: {
        inversionInicial: pInicial,
        tasaInteres: tasa,
        periodos: nPeriodos,
        tipo,
        aportacionMensual: aportacion
      },
      resumen: {
        inversionTotal: Number((pInicial + totalAportaciones).toFixed(2)),
        totalIntereses: Number(totalInteresesGanados.toFixed(2)),
        montoFinal: Number(saldoActual.toFixed(2)),
        gananciaPorcentual: Number((((saldoActual - (pInicial + totalAportaciones)) / (pInicial + totalAportaciones)) * 100).toFixed(2))
      },
      desglose
    };

    // Guardar historial en la tabla 'simulaciones' de Supabase
    const dbResult = await guardarSimulacion(resultado);

    return res.json({
      success: true,
      mensaje: 'Simulación calculada con éxito',
      data: resultado,
      historialGuardado: dbResult.success || false
    });
  } catch (error) {
    console.error('Error al procesar simulación:', error);
    return res.status(500).json({
      error: 'Error interno del servidor al procesar la simulación',
      details: error.message
    });
  }
});

// ============================================================
// Rutas administrativas — solo para usuarios con rol 'desarrollador'
// ============================================================

// GET /api/admin/usuarios — lista todos los usuarios registrados con su perfil
app.get('/api/admin/usuarios', requireDesarrollador, async (req, res) => {
  try {
    const { data: usuarios, error } = await supabaseAdmin
      .from('perfiles')
      .select('id, email, nombre, rol, nivel_prioridad, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.json({ success: true, usuarios });
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    return res.status(500).json({
      error: 'No se pudo obtener la lista de usuarios.',
      details: error.message
    });
  }
});

// Roles que el Desarrollador puede asignar a otros usuarios desde el panel.
// 'desarrollador' (Nivel 1) queda excluido a propósito: es exclusivo del
// Creador y no se otorga ni se quita desde esta interfaz.
const ROLES_ASIGNABLES = {
  administrativo: { nivel_prioridad: 2 },
  operador: { nivel_prioridad: 3 },
  usuario: { nivel_prioridad: 4 }
};

// POST /api/admin/usuarios — crea un usuario nuevo directamente (correo ya
// confirmado, sin esperar el correo de verificación) con el rol indicado.
app.post('/api/admin/usuarios', requireDesarrollador, async (req, res) => {
  try {
    const { email, password, nombre, rol = 'usuario' } = req.body;

    if (!email || !password || !nombre) {
      return res.status(400).json({ error: 'Correo, contraseña y nombre son obligatorios.' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }
    if (!Object.prototype.hasOwnProperty.call(ROLES_ASIGNABLES, rol)) {
      return res.status(400).json({
        error: `Rol inválido. Debe ser uno de: ${Object.keys(ROLES_ASIGNABLES).join(', ')}.`
      });
    }

    // 1) Crea el usuario en Supabase Auth, con el correo ya confirmado.
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: String(email).trim(),
      password: String(password),
      email_confirm: true,
      user_metadata: { nombre: String(nombre).trim() }
    });

    if (createError) throw createError;

    const nuevoId = created.user.id;

    // 2) El trigger handle_new_user ya insertó la fila en 'perfiles' con rol
    // 'usuario' por defecto. Si se pidió un rol distinto, lo actualizamos.
    if (rol !== 'usuario') {
      const { error: updateError } = await supabaseAdmin
        .from('perfiles')
        .update({ rol, nivel_prioridad: ROLES_ASIGNABLES[rol].nivel_prioridad })
        .eq('id', nuevoId);

      if (updateError) throw updateError;
    }

    console.log(`[Admin] ${req.authUser.email} creó el usuario ${created.user.email} con rol ${rol}.`);

    return res.status(201).json({
      success: true,
      mensaje: `Usuario ${created.user.email} creado correctamente con rol ${rol}.`,
      usuario: { id: nuevoId, email: created.user.email, nombre, rol }
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    const yaExiste = /already been registered|already registered/i.test(error.message || '');
    return res.status(yaExiste ? 409 : 500).json({
      error: yaExiste
        ? 'Ya existe un usuario registrado con ese correo.'
        : 'No se pudo crear el usuario.',
      details: error.message
    });
  }
});

// PATCH /api/admin/usuarios/:id/rol — cambia el rol de un usuario existente,
// entre Administrativo (Nivel 2), Operador (Nivel 3) y Usuario (Nivel 4).
// El rol Desarrollador (Nivel 1) no se puede asignar ni quitar desde aquí.
app.patch('/api/admin/usuarios/:id/rol', requireDesarrollador, async (req, res) => {
  try {
    const { id } = req.params;
    const { rol } = req.body;

    if (!Object.prototype.hasOwnProperty.call(ROLES_ASIGNABLES, rol)) {
      return res.status(400).json({
        error: `Rol inválido. Debe ser uno de: ${Object.keys(ROLES_ASIGNABLES).join(', ')}.`
      });
    }

    if (id === req.authUser.id) {
      return res.status(400).json({ error: 'No puedes cambiar tu propio rol desde aquí.' });
    }

    const { data: perfilActual, error: perfilActualError } = await supabaseAdmin
      .from('perfiles')
      .select('rol, email')
      .eq('id', id)
      .single();

    if (perfilActualError) throw perfilActualError;

    if (perfilActual?.rol === 'desarrollador') {
      return res.status(400).json({ error: 'No se puede cambiar el rol de una cuenta Desarrollador desde este panel.' });
    }

    const { error: updateError } = await supabaseAdmin
      .from('perfiles')
      .update({ rol, nivel_prioridad: ROLES_ASIGNABLES[rol].nivel_prioridad })
      .eq('id', id);

    if (updateError) throw updateError;

    console.log(`[Admin] ${req.authUser.email} cambió el rol de ${perfilActual.email} a ${rol}.`);

    return res.json({
      success: true,
      mensaje: `Rol de ${perfilActual.email} actualizado a ${rol}.`
    });
  } catch (error) {
    console.error('Error al cambiar rol:', error);
    return res.status(500).json({
      error: 'No se pudo cambiar el rol del usuario.',
      details: error.message
    });
  }
});

// POST /api/admin/usuarios/:id/reset-password — fija una contraseña nueva
// para cualquier usuario del sistema, sin depender de que reciba un correo.
app.post('/api/admin/usuarios/:id/reset-password', requireDesarrollador, async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevaContrasena } = req.body;

    if (!nuevaContrasena || String(nuevaContrasena).length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      password: String(nuevaContrasena)
    });

    if (error) throw error;

    console.log(`[Admin] ${req.authUser.email} restableció la contraseña de ${data.user.email}.`);

    return res.json({
      success: true,
      mensaje: `Contraseña actualizada correctamente para ${data.user.email}.`
    });
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    return res.status(500).json({
      error: 'No se pudo restablecer la contraseña.',
      details: error.message
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = app;
