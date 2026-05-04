import { useEffect, useMemo, useState } from 'react';
import { Edit3, Plus, X } from 'lucide-react';
import { createTaller, getComparativaTalleres, getTalleres, updateTaller } from '../services/talleresService.js';

const MAX_TALLERES = 2;

const initialForm = {
  Nombre: '',
  Codigo: ''
};

function Talleres() {
  const [talleres, setTalleres] = useState([]);
  const [comparativa, setComparativa] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingTaller, setEditingTaller] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [comparisonError, setComparisonError] = useState('');

  const usedTalleres = talleres.length;
  const hasReachedLimit = usedTalleres >= MAX_TALLERES;

  const planMetrics = useMemo(() => ([
    { label: 'Plan actual', value: 'Basico' },
    { label: 'Talleres usados', value: `${usedTalleres} / ${MAX_TALLERES}` }
  ]), [usedTalleres]);

  useEffect(() => {
    loadTalleres();
    loadComparativa();
  }, []);

  const loadTalleres = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getTalleres();
      setTalleres(Array.isArray(data) ? data : []);
    } catch (requestError) {
      logError('talleres', requestError);
      setTalleres([]);
      setError('No se pudieron cargar los talleres.');
    } finally {
      setLoading(false);
    }
  };

  const loadComparativa = async () => {
    setComparisonLoading(true);
    setComparisonError('');

    try {
      const data = await getComparativaTalleres();
      setComparativa(Array.isArray(data) ? data : []);
    } catch (requestError) {
      logError('comparativa de talleres', requestError);
      setComparativa([]);
      setComparisonError('No se pudo cargar la comparativa de talleres.');
    } finally {
      setComparisonLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setMessage('');
    setError('');

    if (hasReachedLimit) {
      return;
    }

    setEditingTaller(null);
    setForm(initialForm);
    setShowForm(true);
  };

  const handleOpenEdit = (taller) => {
    setMessage('');
    setError('');
    setEditingTaller(taller);
    setForm({
      Nombre: taller.Nombre || '',
      Codigo: taller.Codigo || ''
    });
    setShowForm(true);
  };

  const handleFormChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      Nombre: form.Nombre.trim(),
      Codigo: form.Codigo.trim() || undefined
    };

    if (!payload.Nombre) {
      setError('El nombre es obligatorio.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      if (editingTaller) {
        await updateTaller(getTallerId(editingTaller), payload);
        setMessage('Taller actualizado correctamente.');
      } else {
        await createTaller(payload);
        setMessage('Taller creado correctamente.');
      }

      setShowForm(false);
      setEditingTaller(null);
      setForm(initialForm);
      await loadTalleres();
      await loadComparativa();
    } catch (requestError) {
      logError('guardar taller', requestError);
      setError(getApiMessage(requestError, 'No se pudo guardar el taller.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="module-page">
      <section className="module-toolbar">
        <div>
          <p className="eyebrow">Administracion</p>
          <h2>Talleres</h2>
          <p>Gestiona los puntos de venta incluidos en tu plan actual.</p>
        </div>
        <button className="primary-button" type="button" onClick={handleOpenCreate} disabled={hasReachedLimit}>
          <Plus size={17} />
          <span>Nuevo taller</span>
        </button>
      </section>

      <section className="plan-panel compact-plan-panel">
        {planMetrics.map((metric) => (
          <article className="plan-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </section>

      {message ? <div className="success-panel">{message}</div> : null}
      {error ? <div className="alert-error">{error}</div> : null}

      <section className="comparison-panel">
        <div className="panel-heading">
          <h2>Comparativa del ultimo mes</h2>
        </div>

        {comparisonError ? <div className="alert-error comparison-feedback">{comparisonError}</div> : null}
        {comparisonLoading ? (
          <div className="loading-panel comparison-feedback">Cargando comparativa...</div>
        ) : comparativa.length === 0 ? (
          <div className="info-panel comparison-feedback">Sin datos para comparar.</div>
        ) : (
          <div className="workshop-comparison-grid">
            {comparativa.map((item) => (
              <WorkshopComparisonCard
                key={item.IDTaller}
                item={item}
                isBestBalance={isBestBy(comparativa, item, 'saldo')}
                isBestTyres={isBestBy(comparativa, item, 'neumaticosVendidos')}
              />
            ))}
          </div>
        )}
      </section>

      <section className="table-panel">
        <div className="panel-heading">
          <h2>Talleres registrados</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Codigo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="3" className="empty-row">Cargando talleres...</td></tr>
              ) : talleres.length === 0 ? (
                <tr><td colSpan="3" className="empty-row">No hay talleres registrados.</td></tr>
              ) : talleres.map((taller) => (
                <tr key={getTallerId(taller)}>
                  <td>{taller.Nombre || '-'}</td>
                  <td>{taller.Codigo || '-'}</td>
                  <td>
                    <button className="small-action-button neutral-action" type="button" onClick={() => handleOpenEdit(taller)}>
                      <Edit3 size={14} />
                      <span>Editar</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showForm ? (
        <div className="modal-backdrop">
          <form className="modal-panel" onSubmit={handleSubmit}>
            <div className="modal-heading">
              <div>
                <p className="eyebrow">{editingTaller ? 'Editar taller' : 'Nuevo taller'}</p>
                <h2>{editingTaller ? 'Actualizar taller' : 'Crear taller'}</h2>
              </div>
              <button className="icon-button" type="button" aria-label="Cerrar" onClick={() => setShowForm(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="form-grid">
              <label>
                <span>Nombre</span>
                <input value={form.Nombre} onChange={(event) => handleFormChange('Nombre', event.target.value)} maxLength={150} required />
              </label>
              <label>
                <span>Codigo</span>
                <input value={form.Codigo} onChange={(event) => handleFormChange('Codigo', event.target.value)} maxLength={50} />
              </label>
            </div>

            <div className="modal-actions">
              <button className="ghost-button" type="button" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Guardando...' : editingTaller ? 'Guardar cambios' : 'Crear taller'}</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function WorkshopComparisonCard({ item, isBestBalance, isBestTyres }) {
  return (
    <article className="workshop-card">
      <div className="workshop-card-heading">
        <div>
          <h3>{item.Nombre || 'Taller'}</h3>
          <span>{item.Codigo || '-'}</span>
        </div>
        <div className="workshop-badges">
          {isBestBalance ? <span className="status-badge confirmado">Mejor saldo del mes</span> : null}
          {isBestTyres ? <span className="status-badge pendiente">Mas neumaticos vendidos</span> : null}
        </div>
      </div>

      <div className="workshop-metrics">
        <MetricLine label="Ingresos" value={formatCurrency(item.ingresosTotales)} />
        <MetricLine label="Gastos" value={formatCurrency(item.gastosTotales)} />
        <MetricLine label="Saldo" value={formatCurrency(item.saldo)} strong />
        <MetricLine label="Neumaticos vendidos" value={formatNumber(item.neumaticosVendidos)} />
        <MetricLine label="Cobrado real" value={formatCurrency(item.cobradoReal)} />
        <MetricLine label="Pendiente de cobro" value={formatCurrency(item.pendienteCobro)} />
        <MetricLine label="Ingresos pendientes" value={formatNumber(item.ingresosPendientesCount)} />
      </div>
    </article>
  );
}

function MetricLine({ label, value, strong = false }) {
  return (
    <div className={strong ? 'workshop-metric strong-metric' : 'workshop-metric'}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function isBestBy(items, item, field) {
  const values = items.map((current) => Number(current[field] || 0));
  const maxValue = Math.max(...values);

  return Number(item[field] || 0) === maxValue && maxValue > 0;
}

function getTallerId(taller) {
  return taller.IDTaller ?? taller.idTaller ?? taller.tallerId ?? taller.id ?? taller.Id;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

function formatNumber(value) {
  return new Intl.NumberFormat('es-ES').format(Number(value || 0));
}

function getApiMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

function logError(resource, error) {
  if (import.meta.env.DEV) {
    console.error(`Error en ${resource}:`, error?.response?.data || error);
  }
}

export default Talleres;
