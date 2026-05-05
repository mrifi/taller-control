import { useEffect, useState } from 'react';
import { CheckCircle2, Edit3, Plus, RotateCcw, Settings, SlidersHorizontal, Trash2, X } from 'lucide-react';
import CategoryManagerModal from '../components/Management/CategoryManagerModal.jsx';
import {
  activarCategoriaIngreso,
  createCategoriaIngreso,
  createIngreso,
  deleteIngreso,
  desactivarCategoriaIngreso,
  getCategoriasIngreso,
  getIngresos,
  getTodasCategoriasIngreso,
  marcarComoCobrado,
  updateIngreso,
  updateCategoriaIngreso
} from '../services/ingresosService.js';
import { getTalleres } from '../services/talleresService.js';

const initialFilters = {
  tallerId: '',
  fechaInicio: '',
  fechaFin: '',
  metodoPago: '',
  estadoPago: ''
};

const initialForm = {
  descripcion: '',
  fecha: new Date().toISOString().slice(0, 10),
  monto: '',
  cantidad: '',
  metodoPago: 'Efectivo',
  categoriaId: '',
  tallerId: '',
  estadoPago: 'CONFIRMADO',
  fechaPagoPrevista: '',
  cliente: ''
};

const paymentMethods = ['Efectivo', 'Tarjeta', 'Transferencia', 'Bizum'];
const paymentStates = ['CONFIRMADO', 'PENDIENTE'];
const PAGE_SIZE = 20;

function Ingresos() {
  const [filters, setFilters] = useState(initialFilters);
  const [ingresos, setIngresos] = useState([]);
  const [talleres, setTalleres] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingIngreso, setEditingIngreso] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadTalleres();
    loadCategorias();
    loadIngresos(initialFilters);
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

  const loadCategorias = async () => {
    try {
      const data = await getCategoriasIngreso();
      setCategorias(Array.isArray(data) ? data : []);
    } catch (requestError) {
      logError('categorias de ingreso', requestError);
      setCategorias([]);
    }
  };

  const loadIngresos = async (currentFilters, options = {}) => {
    const offset = options.offset ?? 0;
    const append = options.append ?? false;

    append ? setLoadingMore(true) : setLoading(true);
    setError('');

    try {
      const data = await getIngresos({
        ...cleanFilters(currentFilters),
        limit: PAGE_SIZE,
        offset
      });
      const items = Array.isArray(data) ? data : data.items || [];

      setIngresos((current) => (append ? [...current, ...items] : items));
      setHasMore(Boolean(data.hasMore));
      setNextOffset(data.nextOffset ?? offset + items.length);
    } catch (requestError) {
      logError('ingresos', requestError);
      setError('No se pudieron cargar los ingresos.');
      if (!append) {
        setIngresos([]);
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
    loadIngresos(filters);
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
    loadIngresos(initialFilters);
  };

  const handleLoadMore = () => {
    loadIngresos(filters, { append: true, offset: nextOffset });
  };

  const handleOpenForm = () => {
    setEditingIngreso(null);
    setForm((current) => ({
      ...initialForm,
      tallerId: filters.tallerId || current.tallerId || ''
    }));
    setMessage('');
    setError('');
    setShowForm(true);
  };

  const handleOpenEdit = (ingreso) => {
    setEditingIngreso(ingreso);
    setForm({
      descripcion: ingreso.Descripcion || '',
      fecha: toInputDate(ingreso.Fecha),
      monto: ingreso.Monto ?? '',
      cantidad: ingreso.Cantidad ?? '',
      metodoPago: ingreso.TipoPago || 'Efectivo',
      categoriaId: String(ingreso.IDTipoIngreso || ''),
      tallerId: String(ingreso.IDTaller || ''),
      estadoPago: ingreso.EstadoPago || 'CONFIRMADO',
      fechaPagoPrevista: toInputDate(ingreso.FechaPagoPrevista),
      cliente: ingreso.Cliente || ''
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
      if (editingIngreso) {
        await updateIngreso(getIngresoId(editingIngreso), buildPayload(form));
        setMessage('Ingreso actualizado correctamente.');
      } else {
        await createIngreso(buildPayload(form));
        setMessage('Ingreso creado correctamente.');
      }
      setShowForm(false);
      setEditingIngreso(null);
      await loadIngresos(filters);
    } catch (requestError) {
      logError('guardar ingreso', requestError);
      setError(getApiMessage(requestError, 'No se pudo guardar el ingreso.'));
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAsPaid = async (id) => {
    setError('');
    setMessage('');

    try {
      await marcarComoCobrado(id);
      setMessage('Ingreso marcado como cobrado.');
      await loadIngresos(filters);
    } catch (requestError) {
      logError('marcar como cobrado', requestError);
      setError(getApiMessage(requestError, 'No se pudo marcar el ingreso como cobrado.'));
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('¿Seguro que quieres eliminar este ingreso? Esta acción no se puede deshacer.');

    if (!confirmed) return;

    setError('');
    setMessage('');

    try {
      await deleteIngreso(id);
      setMessage('Ingreso eliminado correctamente.');
      await loadIngresos(filters);
    } catch (requestError) {
      logError('eliminar ingreso', requestError);
      setError(getApiMessage(requestError, 'No se pudo eliminar el ingreso.'));
    }
  };

  return (
    <div className="module-page">
      <section className="module-toolbar">
        <div>
          <p className="eyebrow">Gestion financiera</p>
          <h2>Ingresos</h2>
          <p>Controla ventas confirmadas y cobros pendientes por taller.</p>
        </div>
        <div className="toolbar-actions">
          <button className="ghost-button" type="button" onClick={() => setShowCategoryManager(true)}>
            <Settings size={17} />
            <span>Gestionar categorias</span>
          </button>
          <button className="primary-button" type="button" onClick={handleOpenForm}>
            <Plus size={17} />
            <span>Nuevo ingreso</span>
          </button>
        </div>
      </section>

      <section className="filter-bar module-filters" aria-label="Filtros de ingresos">
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
          <span>Estado</span>
          <select value={filters.estadoPago} onChange={(event) => handleFilterChange('estadoPago', event.target.value)}>
            <option value="">Todos</option>
            {paymentStates.map((state) => <option key={state} value={state}>{state}</option>)}
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

      {message ? <div className="success-panel">{message}</div> : null}
      {error ? <div className="alert-error">{error}</div> : null}

      <section className="table-panel">
        <div className="panel-heading">
          <h2>Listado de ingresos</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripcion</th>
                <th>Cliente</th>
                <th>Monto</th>
                <th>Cantidad</th>
                <th>Metodo</th>
                <th>Estado</th>
                <th>Prevista</th>
                <th>Pago real</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="10" className="empty-row">Cargando ingresos...</td></tr>
              ) : ingresos.length === 0 ? (
                <tr><td colSpan="10" className="empty-row">No hay ingresos para los filtros seleccionados.</td></tr>
              ) : ingresos.map((ingreso) => (
                <tr key={getIngresoId(ingreso)}>
                  <td>{formatDate(ingreso.Fecha)}</td>
                  <td>{ingreso.Descripcion || '-'}</td>
                  <td>{ingreso.Cliente || '-'}</td>
                  <td>{formatCurrency(ingreso.Monto)}</td>
                  <td>{ingreso.Cantidad ?? '-'}</td>
                  <td>{ingreso.TipoPago || '-'}</td>
                  <td><span className={`status-badge ${normalizeStatus(ingreso.EstadoPago)}`}>{ingreso.EstadoPago || 'CONFIRMADO'}</span></td>
                  <td>{formatDate(ingreso.FechaPagoPrevista)}</td>
                  <td>{formatDate(ingreso.FechaPagoReal)}</td>
                  <td>
                    <div className="table-actions">
                      {ingreso.EstadoPago === 'PENDIENTE' ? (
                        <button className="small-action-button" type="button" onClick={() => handleMarkAsPaid(getIngresoId(ingreso))}>
                          <CheckCircle2 size={15} />
                          <span>Marcar como cobrado</span>
                        </button>
                      ) : null}
                      <button className="small-action-button neutral-action" type="button" onClick={() => handleOpenEdit(ingreso)}>
                        <Edit3 size={14} />
                        <span>Editar</span>
                      </button>
                      <button className="small-action-button danger-action" type="button" onClick={() => handleDelete(getIngresoId(ingreso))}>
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
            {loadingMore ? 'Cargando...' : 'Cargar mas ingresos'}
          </button>
        </div>
      ) : null}

      {showForm ? (
        <div className="modal-backdrop">
          <form className="modal-panel" onSubmit={handleSubmit}>
            <div className="modal-heading">
              <div>
                <p className="eyebrow">Nuevo movimiento</p>
                <h2>{editingIngreso ? 'Editar ingreso' : 'Crear ingreso'}</h2>
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
                  <span>Categoria</span>
                  <button className="inline-link-button" type="button" onClick={() => setShowCategoryManager(true)}>+ Crear categoria</button>
                </span>
                <select value={form.categoriaId} onChange={(event) => handleFormChange('categoriaId', event.target.value)} required>
                  <option value="">Selecciona una categoria</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.IDTipoIngreso} value={categoria.IDTipoIngreso}>
                      {categoria.Denominacion || `Categoria ${categoria.IDTipoIngreso}`}
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
              <label>
                <span>Estado pago</span>
                <select value={form.estadoPago} onChange={(event) => handleFormChange('estadoPago', event.target.value)}>
                  {paymentStates.map((state) => <option key={state} value={state}>{state}</option>)}
                </select>
              </label>

              {form.estadoPago === 'PENDIENTE' ? (
                <>
                  <label>
                    <span>Cliente</span>
                    <input value={form.cliente} onChange={(event) => handleFormChange('cliente', event.target.value)} required />
                  </label>
                  <label>
                    <span>Fecha prevista de pago</span>
                    <input type="date" value={form.fechaPagoPrevista} onChange={(event) => handleFormChange('fechaPagoPrevista', event.target.value)} required />
                  </label>
                </>
              ) : null}
            </div>

            <div className="modal-actions">
              <button className="ghost-button" type="button" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Guardando...' : editingIngreso ? 'Guardar cambios' : 'Crear ingreso'}</button>
            </div>
          </form>
        </div>
      ) : null}

      {showCategoryManager ? (
        <CategoryManagerModal
          title="Gestionar categorias de ingresos"
          description="Controla las categorias disponibles para nuevos ingresos sin afectar el historico."
          itemLabel="Categoria"
          idField="IDTipoIngreso"
          fetchItems={getTodasCategoriasIngreso}
          createItem={createCategoriaIngreso}
          updateItem={updateCategoriaIngreso}
          activateItem={activarCategoriaIngreso}
          deactivateItem={desactivarCategoriaIngreso}
          onChanged={loadCategorias}
          onClose={() => setShowCategoryManager(false)}
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
    categoriaId: Number(form.categoriaId),
    tallerId: Number(form.tallerId),
    estadoPago: form.estadoPago,
    fechaPagoPrevista: form.estadoPago === 'PENDIENTE' ? form.fechaPagoPrevista : undefined,
    cliente: form.estadoPago === 'PENDIENTE' ? form.cliente : undefined
  };
}

function cleanFilters(filters) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== '' && value !== null && value !== undefined)
  );
}

function getIngresoId(ingreso) {
  return ingreso.IDIngreso || ingreso.idIngreso || ingreso.id;
}

function getTallerId(taller) {
  return taller.IDTaller ?? taller.idTaller ?? taller.tallerId ?? taller.id ?? taller.Id;
}

function getTallerName(taller) {
  const id = getTallerId(taller);

  return taller.Denominacion || taller.denominacion || taller.Nombre || taller.nombre || `Taller ${id}`;
}

function normalizeStatus(status) {
  return String(status || 'CONFIRMADO').toLowerCase();
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

export default Ingresos;
