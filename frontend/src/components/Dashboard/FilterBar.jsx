import { RotateCcw, SlidersHorizontal } from 'lucide-react';

function FilterBar({ filters, talleres, loading, talleresLoading, talleresError, onChange, onApply, onClear }) {
  const hasTalleres = talleres.length > 0;

  return (
    <section className="filter-bar" aria-label="Filtros del dashboard">
      <label>
        <span>Taller</span>
        <select
          value={filters.tallerId}
          onChange={(event) => onChange('tallerId', event.target.value)}
          disabled={talleresLoading}
        >
          <option value="">Selecciona un taller</option>
          {talleres.map((taller) => (
            <option key={getTallerId(taller)} value={getTallerId(taller)}>
              {getTallerName(taller)}
            </option>
          ))}
        </select>
        {talleresError ? <small className="field-message error-text">{talleresError}</small> : null}
        {!talleresError && !talleresLoading && !hasTalleres ? (
          <small className="field-message">No hay talleres registrados.</small>
        ) : null}
      </label>

      <label>
        <span>Fecha inicio</span>
        <input
          type="date"
          value={filters.fechaInicio}
          onChange={(event) => onChange('fechaInicio', event.target.value)}
        />
      </label>

      <label>
        <span>Fecha fin</span>
        <input
          type="date"
          value={filters.fechaFin}
          onChange={(event) => onChange('fechaFin', event.target.value)}
        />
      </label>

      <div className="filter-actions">
        <button className="primary-button" type="button" onClick={onApply} disabled={loading}>
          <SlidersHorizontal size={17} />
          <span>Aplicar filtros</span>
        </button>
        <button className="ghost-button" type="button" onClick={onClear} disabled={loading}>
          <RotateCcw size={17} />
          <span>Limpiar filtros</span>
        </button>
      </div>
    </section>
  );
}

function getTallerId(taller) {
  return taller.IDTaller ?? taller.idTaller ?? taller.tallerId ?? taller.id ?? taller.Id;
}

function getTallerName(taller) {
  const id = getTallerId(taller);

  return (
    taller.Denominacion ||
    taller.denominacion ||
    taller.Nombre ||
    taller.nombre ||
    taller.nombreTaller ||
    taller.descripcion ||
    `Taller ${id}`
  );
}

export default FilterBar;
