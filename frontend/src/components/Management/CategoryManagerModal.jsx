import { useEffect, useState } from 'react';
import { Edit3, Plus, RotateCcw, X } from 'lucide-react';

function CategoryManagerModal({
  title,
  description,
  itemLabel,
  idField,
  fetchItems,
  createItem,
  updateItem,
  activateItem,
  deactivateItem,
  onClose,
  onChanged
}) {
  const [items, setItems] = useState([]);
  const [denominacion, setDenominacion] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await fetchItems();
      setItems(Array.isArray(data) ? data : []);
    } catch (requestError) {
      logError(title, requestError);
      setItems([]);
      setError(`No se pudo cargar la lista de ${itemLabel.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  };

  const refreshAfterChange = async (successMessage) => {
    setMessage(successMessage);
    setError('');
    setDenominacion('');
    setEditingItem(null);
    await loadItems();
    await onChanged?.();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const cleanName = denominacion.trim();

    if (!cleanName) {
      setError('La denominacion es obligatoria.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      if (editingItem) {
        await updateItem(getItemId(editingItem, idField), { denominacion: cleanName });
        await refreshAfterChange(`${itemLabel} actualizado correctamente.`);
      } else {
        await createItem({ denominacion: cleanName });
        await refreshAfterChange(`${itemLabel} creado correctamente.`);
      }
    } catch (requestError) {
      logError(`guardar ${itemLabel}`, requestError);
      setError(getApiMessage(requestError, `No se pudo guardar ${itemLabel.toLowerCase()}.`));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setDenominacion(item.Denominacion || '');
    setMessage('');
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setDenominacion('');
    setError('');
  };

  const handleToggle = async (item) => {
    const isActive = Boolean(item.Activo);
    const itemId = getItemId(item, idField);

    if (isActive) {
      const confirmed = window.confirm(`Este ${itemLabel.toLowerCase()} dejara de aparecer al crear nuevos movimientos, pero se mantendra en historicos.`);
      if (!confirmed) return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      if (isActive) {
        await deactivateItem(itemId);
        await refreshAfterChange(`${itemLabel} desactivado correctamente.`);
      } else {
        await activateItem(itemId);
        await refreshAfterChange(`${itemLabel} activado correctamente.`);
      }
    } catch (requestError) {
      logError(`cambiar estado ${itemLabel}`, requestError);
      setError(getApiMessage(requestError, `No se pudo actualizar el estado de ${itemLabel.toLowerCase()}.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <section className="modal-panel manager-modal">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Gestion</p>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <button className="icon-button" type="button" aria-label="Cerrar" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form className="manager-form" onSubmit={handleSubmit}>
          <label>
            <span>Denominacion</span>
            <input value={denominacion} onChange={(event) => setDenominacion(event.target.value)} maxLength={100} required />
          </label>
          <div className="manager-form-actions">
            {editingItem ? (
              <button className="ghost-button" type="button" onClick={handleCancelEdit} disabled={saving}>
                <RotateCcw size={16} />
                <span>Cancelar edicion</span>
              </button>
            ) : null}
            <button className="primary-button" type="submit" disabled={saving}>
              <Plus size={16} />
              <span>{saving ? 'Guardando...' : editingItem ? 'Guardar cambios' : `Anadir ${itemLabel.toLowerCase()}`}</span>
            </button>
          </div>
        </form>

        {message ? <div className="success-panel manager-feedback">{message}</div> : null}
        {error ? <div className="alert-error manager-feedback">{error}</div> : null}

        <div className="manager-list table-wrap">
          <table>
            <thead>
              <tr>
                <th>Denominacion</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="3" className="empty-row">Cargando...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan="3" className="empty-row">No hay elementos registrados.</td></tr>
              ) : items.map((item) => (
                <tr key={getItemId(item, idField)}>
                  <td>{item.Denominacion || '-'}</td>
                  <td>
                    <span className={`status-badge ${item.Activo ? 'confirmado' : 'inactiva'}`}>
                      {item.Activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="small-action-button neutral-action" type="button" onClick={() => handleEdit(item)} disabled={saving}>
                        <Edit3 size={14} />
                        <span>Editar</span>
                      </button>
                      <button className="small-action-button neutral-action" type="button" onClick={() => handleToggle(item)} disabled={saving}>
                        {item.Activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function getItemId(item, idField) {
  return item[idField] ?? item.id;
}

function getApiMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

function logError(resource, error) {
  if (import.meta.env.DEV) {
    console.error(`Error en ${resource}:`, error?.response?.data || error);
  }
}

export default CategoryManagerModal;
