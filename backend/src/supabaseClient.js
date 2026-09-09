require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const rawUrl = process.env.SUPABASE_URL || 'https://opsdfefftzvhljjueljm.supabase.co';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc2RmZWZmdHp2aGxqanVlbGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4ODEzOTgsImV4cCI6MjEwNDQ1NzM5OH0.qD9v39_149Gp9TJyCEVnm3FlbRPMutzLz0c3qm8dJpY';

let supabase = null;

const esConfigValida = 
  supabaseUrl && 
  supabaseKey && 
  !supabaseUrl.includes('tu-proyecto') && 
  !supabaseKey.includes('tu-supabase-key');

if (esConfigValida) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[Supabase Backend] Cliente inicializado correctamente.');
  } catch (error) {
    console.error('[Supabase Backend] Error al inicializar cliente:', error.message);
  }
} else {
  console.log('[Supabase Backend] Variables de entorno por defecto o no configuradas. Guardado en modo pasivo.');
}

/**
 * Guarda el registro de una simulación en la tabla 'simulaciones'.
 * 
 * @param {Object} datosSimulacion - Objeto con los parámetros, resumen y desglose de la simulación.
 * @returns {Promise<{success: boolean, data?: any, error?: any}>}
 */
async function guardarSimulacion(datosSimulacion) {
  if (!supabase) {
    console.warn('[Supabase] No se pudo guardar la simulación: cliente no configurado con credenciales válidas.');
    return {
      success: false,
      skipped: true,
      mensaje: 'Credenciales de Supabase no configuradas'
    };
  }

  try {
    const { parametros, resumen, desglose } = datosSimulacion;

    const registro = {
      inversion_inicial: parametros?.inversionInicial,
      tasa_interes: parametros?.tasaInteres,
      periodos: parametros?.periodos,
      tipo: parametros?.tipo || 'compuesto',
      aportacion_mensual: parametros?.aportacionMensual || 0,
      inversion_total: resumen?.inversionTotal,
      total_intereses: resumen?.totalIntereses,
      monto_final: resumen?.montoFinal,
      ganancia_porcentual: resumen?.gananciaPorcentual,
      desglose: desglose,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('simulaciones')
      .insert([registro])
      .select();

    if (error) {
      console.error('[Supabase] Error al insertar en la tabla simulaciones:', error.message);
      return { success: false, error: error.message };
    }

    console.log('[Supabase] Simulación guardada exitosamente en la tabla simulaciones.');
    return { success: true, data };
  } catch (err) {
    console.error('[Supabase] Excepción inesperada al guardar simulación:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  supabase,
  guardarSimulacion
};
