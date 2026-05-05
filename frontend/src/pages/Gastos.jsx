import { useEffect, useState } from 'react';
import { Edit3, Plus, RotateCcw, Settings, SlidersHorizontal, Trash2, X } from 'lucide-react';
import CategoryManagerModal from '../components/Management/CategoryManagerModal.jsx';
import {
  activarTipoGasto,
  createGasto,
  createTipoGasto,
  deleteGasto,
  desactivarTipoGasto,
  getGastos,
  getTiposGasto,
  getTodosTiposGasto,
  updateGasto,
  updateTipoGasto
} from '../services/gastosService.js';
import { getTalleres } from '../services/talleresService.js';

const initialFilters = {
  tallerId: '',
  fechaInicio: '',
  fechaFin: '',
  metodoPago: '',
  tipoGastoId: ''
};

const initialForm = {
  descripcion: '',
  fecha: new Date().toISOString().slice(0, 10),
  monto: '',
  cantidad: '1',
  metodoPago: 'Efectivo',
  tipoGastoId: '',
  tallerId: ''
};

const paymentMethods = ['Efectivo', 'Tarjeta', 'Transferencia', 'Bizum'];
const PAGE_SIZE = 20;

function Gastos() {
  const [filters, setFilters] = useState(initialFilters);
  const [gastos, setGastos] = useState([]);
  const [talleres, setTalleres] = useState([]);
  const [tiposGasto, setTiposGasto] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingGasto, setEditingGasto] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showTypeManager, setShowTypeManager] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadTalleres();
    loadTiposGasto();
    loadGastos(initialFilters);
  }, []);

  const loadTalleres = async () => {
    try {
      const data = await getTalleres();
      setTalleres(Array.isArray(data) ? data : []);
    } catch (requestError) {
      logError('talleres', requestError);
      setTalleres([]);
    }
  };

  const loadTiposGasto = async () => {
    try {
      const data = await getTiposGasto();
      setTiposGasto(Array.isArray(data) ? data : []);
    } catch (requestError) {
      logError('tipos de gasto', requestError);
      setTiposGasto([]);
      setError('No se pudieron cargar los tipos de gasto.');
    }
  };

  const loadGastos = async (currentFilters, options = {}) => {
    const offset = options.offset ?? 0;
    const append = options.append ?? false;

    append ? setLoadingMore(true) : setLoading(true);
    setError('');

    try {
      const data = await getGastos({
        ...cleanFilters(currentFilters),
        limit: PAGE_SIZE,
        offset
      });
      const items = Array.isArray(data) ? data : data.items || [];

      setGastos((current) => (append ? [...current, ...items] : items));
      setHasMore(Boolean(data.hasMore));
      setNextOffset(data.nextOffset ?? offset + items.length);
    } catch (requestError) {
      logError('gastos', requestError);
      setError('No se pudieron cargar los gastos.');
      if (!append) {
        setGastos([]);
        setHasMore(false);
        setNextOffset(0);
      }
    } finally {
      append ? setLoadingMore(false) : setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const handleFormChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleApplyFilters = () => {
    loadGastos(filters);
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
    loadGastos(initialFilters);
  };

  const handleLoadMore = () => {
    loadGastos(filters, { append: true, offset: nextOffset });
  };

  const handleOpenForm = () => {
    setEditingGasto(null);
    setForm((current) => ({
      ...initialForm,
      tallerId: filters.tallerId || current.tallerId || '',
      tipoGastoId: filters.tipoGastoId || current.tipoGastoId || ''
    }));
    setMessage('');
    setError('');
    setShowForm(true);
  };

  const handleOpenEdit = (gasto) => {
    setEditingGasto(gasto);
    setForm({
      descripcion: gasto.Descripcion || '',
      fecha: toInputDate(gasto.Fecha),
      monto: gasto.Monto ?? '',
      cantidad: gasto.Cantidad ?? '1',
      metodoPago: gasto.TipoPago || 'Efectivo',
      tipoGastoId: String(gasto.IDTipoGasto || ''),
      tallerId: String(gasto.IDTaller || '')
    });
    setMessage('');
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      if (editingGasto) {
        await updateGasto(getGastoId(editingGasto), buildPayload(form));
        setMessage('Gasto actualizado correctamente.');
      } else {
        await createGasto(buildPayload(form));
        setMessage('Gasto creado correctamente.');
      }
      setShowForm(false);
      setEditingGasto(null);
      await loadGastos(filters);
    } catch (requestError) {
      logError('guardar gasto', requestError);
      setError(getApiMessage(requestError, 'No se pudo guardar el gasto.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('¿Seguro que quieres eliminar este gasto? Esta acción no se puede deshacer.');

    if (!confirmed) return;

    setError('');
    setMessage('');

    try {
      await deleteGasto(id);
      setMessage('Gasto eliminado correctamente.');
      await loadGastos(filters);
    } catch (requestError) {
      logError('eliminar gasto', requestError);
      setError(getApiMessage(requestError, 'No se pudo eliminar el gasto.'));
    }
  };

  return (
    <div className="module-page">
      <section className="module-toolbar">
        <div>
          <p className="eyebrow">Gestion financiera</p>
          <h2>Gastos</h2>
          <p>Controla compras, costes operativos y salidas de caja por taller.</p>
        </div>
        <div className="toolbar-actions">
          <button className="ghost-button" type="button" onClick={() => setShowTypeManager(true)}>
            <Settings size={17} />
            <span>Gestionar tipos de gasto</span>
          </button>
          <button className="primary-button" type="button" onClick={handleOpenForm}>
            <Plus size={17} />
            <span>Nuevo gasto</span>
          </button>
        </div>
      </section>

      <section className="filter-bar module-filters" aria-label="Filtros de gastos">
        <label>
          <span>Taller</span>
          <select value={filters.tallerId} onChange={(event) => handleFilterChange('tallerId', event.target.value)}>
            <option value="">Todos</option>
            {talleres.map((taller) => (
              <option key={getTallerId(taller)} value={getTallerId(taller)}>
                {getTallerName(taller)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Fecha inicio</span>
          <input type="date" value={filters.fechaInicio} onChange={(event) => handleFilterChange('fechaInicio', event.target.value)} />
        </label>
        <label>
          <span>Fecha fin</span>
          <input type="date" value={filters.fechaFin} onChange={(event) => handleFilterChange('fechaFin', event.target.value)} />
        </label>
        <label>
          <span>Metodo pago</span>
          <select value={filters.metodoPago} onChange={(event) => handleFilterChange('metodoPago', event.target.value)}>
            <option value="">Todos</option>
            {paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
          </select>
        </label>
        <label>
          <span>Tipo gasto</span>
          <select value={filters.tipoGastoId} onChange={(event) => handleFilterChange('tipoGastoId', event.target.value)}>
            <option value="">Todos</option>
            {tiposGasto.map((tipo) => (
              <option key={tipo.IDTipoGasto} value={tipo.IDTipoGasto}>
                {tipo.Denominacion || `Tipo ${tipo.IDTipoGasto}`}
              </option>
            ))}
          </select>
        </label>
        <div className="filter-actions">
          <button className="primary-button" type="button" onClick={handleApplyFilters} disabled={loading}>
            <SlidersHorizontal size={17} />
            <span>Aplicar</span>
          </button>
          <button className="ghost-button" type="button" onClick={handleClearFilters} disabled={loading}>
            <RotateCcw size={17} />
            <span>Limpiar</span>
          </button>
        </div>
      </section>

      {tiposGasto.length === 0 && !error ? <div className="info-panel">No hay tipos de gasto registrados.</div> : null}
      {message ? <div className="success-panel">{message}</div> : null}
      {error ? <div className="alert-error">{error}</div> : null}

      <section className="table-panel">
        <div className="panel-heading">
          <h2>Listado de gastos</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripcion</th>
                <th>Monto</th>
                <th>Cantidad</th>
                <th>Metodo</th>
                <th>Tipo de gasto</th>
                <th>Taller</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="empty-row">Cargando gastos...</td></tr>
              ) : gastos.length === 0 ? (
                <tr><td colSpan="8" className="empty-row">No hay gastos para los filtros seleccionados.</td></tr>
              ) : gastos.map((gasto) => (
                <tr key={getGastoId(gasto)}>
                  <td>{formatDate(gasto.Fecha)}</td>
                  <td>{gasto.Descripcion || '-'}</td>
                  <td>{formatCurrency(gasto.Monto)}</td>
                  <td>{gasto.Cantidad ?? '-'}</td>
                  <td>{gasto.TipoPago || '-'}</td>
                  <td>{gasto.TipoGasto || '-'}</td>
                  <td>{gasto.Taller || '-'}</td>
                  <td>
                    <div className="table-actions">
                      <button className="small-action-button neutral-action" type="button" onClick={() => handleOpenEdit(gasto)}>
                        <Edit3 size={14} />
                        <span>Editar</span>
                      </button>
                      <button className="small-action-button danger-action" type="button" onClick={() => handleDelete(getGastoId(gasto))}>
                        <Trash2 size={14} />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {hasMore ? (
        <div className="load-more-row">
          <button className="ghost-button" type="button" onClick={handleLoadMore} disabled={loadingMore}>
            {loadingMore ? 'Cargando...' : 'Cargar mas gastos'}
          </button>
        </div>
      ) : null}

      {showForm ? (
        <div className="modal-backdrop">
          <form className="modal-panel" onSubmit={handleSubmit}>
            <div className="modal-heading">
              <div>
                <p className="eyebrow">Nuevo movimiento</p>
                <h2>{editingGasto ? 'Editar gasto' : 'Crear gasto'}</h2>
              </div>
              <button className="icon-button" type="button" aria-label="Cerrar" onClick={() => setShowForm(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="form-grid">
              <label>
                <span>Descripcion</span>
                <input value={form.descripcion} onChange={(event) => handleFormChange('descripcion', event.target.value)} required />
              </label>
              <label>
                <span>Fecha</span>
                <input type="date" value={form.fecha} onChange={(event) => handleFormChange('fecha', event.target.value)} required />
              </label>
              <label>
                <span>Monto</span>
                <input type="number" step="0.01" min="0" value={form.monto} onChange={(event) => handleFormChange('monto', event.target.value)} required />
              </label>
              <label>
                <span>Cantidad</span>
                <input type="number" min="1" value={form.cantidad} onChange={(event) => handleFormChange('cantidad', event.target.value)} required />
              </label>
              <label>
                <span>Metodo pago</span>
                <select value={form.metodoPago} onChange={(event) => handleFormChange('metodoPago', event.target.value)}>
                  {paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
                </select>
              </label>
              <label>
                <span className="field-title-row">
                  <span>Tipo de gasto</span>
                  <button className="inline-link-button" type="button" onClick={() => setShowTypeManager(true)}>+ Crear tipo</button>
                </span>
                <select value={form.tipoGastoId} onChange={(event) => handleFormChange('tipoGastoId', event.target.value)} required>
                  <option value="">Selecciona un tipo</option>
                  {tiposGasto.map((tipo) => (
                    <option key={tipo.IDTipoGasto} value={tipo.IDTipoGasto}>
                      {tipo.Denominacion || `Tipo ${tipo.IDTipoGasto}`}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Taller</span>
                <select value={form.tallerId} onChange={(event) => handleFormChange('tallerId', event.target.value)} required>
                  <option value="">Selecciona un taller</option>
                  {talleres.map((taller) => (
                    <option key={getTallerId(taller)} value={getTallerId(taller)}>
                      {getTallerName(taller)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="modal-actions">
              <button className="ghost-button" type="button" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Guardando...' : editingGasto ? 'Guardar cambios' : 'Crear gasto'}</button>
            </div>
          </form>
        </div>
      ) : null}

      {showTypeManager ? (
        <CategoryManagerModal
          title="Gestionar tipos de gasto"
          description="Controla los tipos disponibles para nuevos gastos sin afectar el historico."
          itemLabel="Tipo de gasto"
          idField="IDTipoGasto"
          fetchItems={getTodosTiposGasto}
          createItem={createTipoGasto}
          updateItem={updateTipoGasto}
          activateItem={activarTipoGasto}
          deactivateItem={desactivarTipoGasto}
          onChanged={loadTiposGasto}
          onClose={() => setShowTypeManager(false)}
        />
      ) : null}
    </div>
  );
}

function buildPayload(form) {
  return {
    descripcion: form.descripcion,
    fecha: form.fecha,
    monto: Number(form.monto),
    cantidad: Number(form.cantidad),
    metodoPago: form.metodoPago,
    tipoGastoId: Number(form.tipoGastoId),
    tallerId: Number(form.tallerId)
  };
}

function cleanFilters(filters) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== '' && value !== null && value !== undefined)
  );
}

function getGastoId(gasto) {
  return gasto.IDGasto || gasto.idGasto || gasto.id;
}

function getTallerId(taller) {
  return taller.IDTaller ?? taller.idTaller ?? taller.tallerId ?? taller.id ?? taller.Id;
}

function getTallerName(taller) {
  const id = getTallerId(taller);

  return taller.Denominacion || taller.denominacion || taller.Nombre || taller.nombre || `Taller ${id}`;
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : new Intl.DateTimeFormat('es-ES').format(date);
}

function toInputDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

function getApiMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

function logError(resource, error) {
  if (import.meta.env.DEV) {
    console.error(`Error en ${resource}:`, error?.response?.data || error);
  }
}

export default Gastos;
