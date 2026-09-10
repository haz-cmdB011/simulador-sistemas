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
