import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Percent,
  Calendar,
  Layers,
  Activity,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  AlertCircle,
  PiggyBank,
  CheckCircle2,
  Table
} from 'lucide-react';

const API_URL = "https://simulador-backend-pt4w.onrender.com";

function App() {
  const [formData, setFormData] = useState({
    inversionInicial: 5000,
    tasaInteres: 8, // Expresado en % para el usuario
    periodos: 12,
    tipo: 'compuesto',
    aportacionMensual: 200
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [serverOnline, setServerOnline] = useState(null);

  // Comprobar salud del servidor backend al montar
  const checkHealth = async () => {
    try {
      const response = await fetch(`${API_URL}/api/health`);
      if (response.ok) {
        setServerOnline(true);
      } else {
        setServerOnline(false);
      }
    } catch {
      setServerOnline(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTipoChange = (tipo) => {
    setFormData((prev) => ({ ...prev, tipo }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Convertir tasa porcentual (ej. 8% -> 0.08)
      const payload = {
        inversionInicial: Number(formData.inversionInicial),
        tasaInteres: Number(formData.tasaInteres) / 100,
        periodos: Number(formData.periodos),
        tipo: formData.tipo,
        aportacionMensual: Number(formData.aportacionMensual || 0)
      };

      const response = await fetch(`${API_URL}/api/simular`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al procesar la simulación');
      }

      setResultado(data.data);
      setServerOnline(true);
    } catch (err) {
      console.error('Error al simular:', err);
      setError(
        err.message.includes('Failed to fetch')
          ? 'No se pudo conectar con el servidor backend en Render. Asegúrate de que el servicio esté activo.'
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  // Simulación inicial automática al cargar
  useEffect(() => {
    handleSubmit();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(val || 0);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand-area">
          <div className="brand-icon">
            <TrendingUp size={28} />
          </div>
          <div>
            <h1 className="brand-title">Simulador de Sistemas</h1>
            <p className="brand-subtitle">Cálculo interactivo de proyecciones y rendimientos</p>
          </div>
        </div>

        <div className="status-badge">
          <div
            className={`status-dot ${serverOnline === null
                ? 'checking'
                : serverOnline
                  ? 'online'
                  : 'offline'
              }`}
          />
          <span>
            {serverOnline === null
              ? 'Verificando API...'
              : serverOnline
                ? 'Backend API Conectado'
                : 'Backend API Desconectado'}
          </span>
          <button
            onClick={checkHealth}
            title="Reintentar conexión"
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="main-grid">
        {/* Formulario */}
        <div className="glass-card">
          <div className="card-header">
            <h2 className="card-title">
              <Sparkles size={20} color="var(--primary-light)" />
              Parámetros
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="sim-form">
            {/* Inversión Inicial */}
            <div className="form-group">
              <label className="form-label" htmlFor="inversionInicial">
                <span>Inversión Inicial</span>
                <span className="form-hint">Monto de partida</span>
              </label>
              <div className="input-wrapper">
                <DollarSign size={18} className="input-icon" />
                <input
                  id="inversionInicial"
                  name="inversionInicial"
                  type="number"
                  min="0"
                  step="100"
                  className="form-input"
                  value={formData.inversionInicial}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Aportación Mensual */}
            <div className="form-group">
              <label className="form-label" htmlFor="aportacionMensual">
                <span>Aportación Periódica</span>
                <span className="form-hint">Opcional por período</span>
              </label>
              <div className="input-wrapper">
                <PiggyBank size={18} className="input-icon" />
                <input
                  id="aportacionMensual"
                  name="aportacionMensual"
                  type="number"
                  min="0"
                  step="50"
                  className="form-input"
                  value={formData.aportacionMensual}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Tasa de Interés */}
            <div className="form-group">
              <label className="form-label" htmlFor="tasaInteres">
                <span>Tasa de Interés por Período (%)</span>
                <span className="form-hint">Ejemplo: 8%</span>
              </label>
              <div className="input-wrapper">
                <Percent size={18} className="input-icon" />
                <input
                  id="tasaInteres"
                  name="tasaInteres"
                  type="number"
                  min="0"
                  max="1000"
                  step="0.1"
                  className="form-input"
                  value={formData.tasaInteres}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Períodos */}
            <div className="form-group">
              <label className="form-label" htmlFor="periodos">
                <span>Número de Períodos</span>
                <span className="form-hint">Meses / Ciclos</span>
              </label>
              <div className="input-wrapper">
                <Calendar size={18} className="input-icon" />
                <input
                  id="periodos"
                  name="periodos"
                  type="number"
                  min="1"
                  max="120"
                  className="form-input"
                  value={formData.periodos}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Sistema / Tipo de Interés */}
            <div className="form-group">
              <label className="form-label">
                <span>Tipo de Cálculo</span>
              </label>
              <div className="system-toggle">
                <button
                  type="button"
                  className={`toggle-btn ${formData.tipo === 'compuesto' ? 'active' : ''}`}
                  onClick={() => handleTipoChange('compuesto')}
                >
                  Compuesto
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${formData.tipo === 'simple' ? 'active' : ''}`}
                  onClick={() => handleTipoChange('simple')}
                >
                  Simple
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw size={18} className="spin" />
                  Calculando Simulación...
                </>
              ) : (
                <>
                  <Activity size={18} />
                  Calcular Simulación
                </>
              )}
            </button>
          </form>
        </div>

        {/* Sección de Resultados */}
        <div className="results-container">
          {error && (
            <div className="error-banner">
              <AlertCircle size={20} />
              <div>
                <strong>Error en la petición:</strong> {error}
              </div>
            </div>
          )}

          {resultado ? (
            <>
              {/* KPIs */}
              <div className="stats-grid">
                <div className="stat-card" style={{ '--card-accent': 'var(--secondary)' }}>
                  <div className="stat-label">Inversión Total</div>
                  <div className="stat-value">
                    {formatCurrency(resultado.resumen.inversionTotal)}
                  </div>
                  <div className="stat-badge" style={{ color: 'var(--secondary)' }}>
                    <Layers size={13} /> Capital aportado
                  </div>
                </div>

                <div className="stat-card" style={{ '--card-accent': 'var(--accent)' }}>
                  <div className="stat-label">Intereses Generados</div>
                  <div className="stat-value" style={{ color: 'var(--accent)' }}>
                    +{formatCurrency(resultado.resumen.totalIntereses)}
                  </div>
                  <div className="stat-badge">
                    <ArrowUpRight size={13} /> Ganancia neta
                  </div>
                </div>

                <div className="stat-card" style={{ '--card-accent': 'var(--primary-light)' }}>
                  <div className="stat-label">Monto Final Proyectado</div>
                  <div className="stat-value" style={{ color: '#ffffff' }}>
                    {formatCurrency(resultado.resumen.montoFinal)}
                  </div>
                  <div className="stat-badge" style={{ color: 'var(--primary-light)' }}>
                    <CheckCircle2 size={13} /> Saldo acumulado
                  </div>
                </div>

                <div className="stat-card" style={{ '--card-accent': 'var(--warning)' }}>
                  <div className="stat-label">Rendimiento Total</div>
                  <div className="stat-value" style={{ color: 'var(--warning)' }}>
                    {resultado.resumen.gananciaPorcentual}%
                  </div>
                  <div className="stat-badge" style={{ color: 'var(--warning)' }}>
                    <Percent size={13} /> ROI acumulado
                  </div>
                </div>
              </div>

              {/* Barra de Proporción Capital vs Interés */}
              <div className="progress-card">
                <div className="progress-header">
                  <span>Composición del Capital Final</span>
                  <span>{formatCurrency(resultado.resumen.montoFinal)}</span>
                </div>
                <div className="progress-bar-track">
                  <div
                    className="progress-bar-fill-initial"
                    style={{
                      width: `${Math.min(
                        100,
                        (resultado.resumen.inversionTotal / resultado.resumen.montoFinal) * 100
                      )}%`
                    }}
                    title={`Capital Aportado: ${formatCurrency(resultado.resumen.inversionTotal)}`}
                  />
                  <div
                    className="progress-bar-fill-interest"
                    style={{
                      width: `${Math.min(
                        100,
                        (resultado.resumen.totalIntereses / resultado.resumen.montoFinal) * 100
                      )}%`
                    }}
                    title={`Intereses: ${formatCurrency(resultado.resumen.totalIntereses)}`}
                  />
                </div>
                <div className="progress-legend">
                  <div className="legend-item">
                    <div className="legend-dot" style={{ backgroundColor: 'var(--secondary)' }} />
                    <span>
                      Capital Aportado ({((resultado.resumen.inversionTotal / resultado.resumen.montoFinal) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ backgroundColor: 'var(--accent)' }} />
                    <span>
                      Intereses ({((resultado.resumen.totalIntereses / resultado.resumen.montoFinal) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabla de Desglose */}
              <div className="glass-card">
                <div className="card-header">
                  <h3 className="card-title">
                    <Table size={18} color="var(--primary-light)" />
                    Desglose por Período ({resultado.desglose.length} ciclos)
                  </h3>
                </div>

                <div className="table-wrapper">
                  <table className="sim-table">
                    <thead>
                      <tr>
                        <th>Período</th>
                        <th>Aportación</th>
                        <th>Interés Generado</th>
                        <th>Saldo Acumulado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultado.desglose.map((fila) => (
                        <tr key={fila.periodo}>
                          <td><strong>Ciclo #{fila.periodo}</strong></td>
                          <td className="num-cell">{formatCurrency(fila.aportacion)}</td>
                          <td className="num-cell gain-positive">+{formatCurrency(fila.interesGanado)}</td>
                          <td className="num-cell" style={{ fontWeight: 600 }}>
                            {formatCurrency(fila.saldoFinal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            !loading && (
              <div className="glass-card empty-state">
                <div className="empty-icon">
                  <Activity size={32} />
                </div>
                <h3>Sin resultados todavía</h3>
                <p>Ingresa los parámetros y haz clic en "Calcular Simulación" para ver la proyección.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
