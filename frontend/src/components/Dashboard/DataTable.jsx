function DataTable({ title, rows }) {
  return (
    <section className="table-panel">
      <div className="panel-heading">
        <h2>{title}</h2>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Descripcion</th>
              <th>Fecha</th>
              <th>Monto</th>
              <th>Cantidad</th>
              <th>Metodo</th>
              <th>Taller</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-row">No hay movimientos para los filtros seleccionados.</td>
              </tr>
            ) : (
              rows.slice(0, 8).map((row, index) => (
                <tr key={row.IDIngreso || row.IDGasto || row.id || row.ingresoId || row.gastoId || `${title}-${index}`}>
                  <td>{row.Descripcion || row.descripcion || row.concepto || 'Sin descripcion'}</td>
                  <td>{formatDate(row.Fecha || row.fecha || row.createdAt)}</td>
                  <td>{formatCurrency(row.Monto || row.monto || row.Total || row.total || 0)}</td>
                  <td>{row.Cantidad ?? row.cantidad ?? '-'}</td>
                  <td>{row.TipoPago || row.metodoPago || row.metodo_pago || '-'}</td>
                  <td>{row.Taller || row.taller || row.nombreTaller || row.tallerNombre || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatDate(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('es-ES').format(date);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

export default DataTable;
