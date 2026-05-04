import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CircleDollarSign,
  FileText,
  HandCoins,
  Printer,
  RotateCcw,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  Wrench
} from 'lucide-react';
import MetricCard from '../components/Dashboard/MetricCard.jsx';
import { getReporteResumen } from '../services/reportesService.js';
import { getTalleres } from '../services/talleresService.js';

const initialFilters = {
  tallerId: '',
  fechaInicio: '',
  fechaFin: ''
};

const emptyReport = {
  resumen: {
    facturacionTotal: 0,
    cobradoReal: 0,
    pendienteCobro: 0,
    totalGastos: 0,
    saldoReal: 0,
    saldoPrevisto: 0,
    neumaticosVendidos: 0,
    ingresosPendientesCount: 0,
    ingresosVencidosCount: 0
  },
  ingresos: [],
  gastos: [],
  pendientes: [],
  ingresosPorCategoria: [],
  gastosPorCategoria: []
};

function Reportes() {
  const [filters, setFilters] = useState(initialFilters);
  const [talleres, setTalleres] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [talleresLoading, setTalleresLoading] = useState(false);
  const [error, setError] = useState('');
  const [talleresError, setTalleresError] = useState('');

  useEffect(() => {
    loadTalleres();
  }, []);

  const selectedTaller = useMemo(() => {
    return talleres.find((taller) => String(getTallerId(taller)) === String(filters.tallerId));
  }, [filters.tallerId, talleres]);

  const currentReport = report || emptyReport;
  const hasReport = Boolean(report);
  const hasAnyData = hasReport && (
    currentReport.ingresos.length > 0 ||
    currentReport.gastos.length > 0 ||
    currentReport.pendientes.length > 0 ||
    currentReport.ingresosPorCategoria.length > 0 ||
    currentReport.gastosPorCategoria.length > 0 ||
    Number(currentReport.resumen.facturacionTotal || 0) > 0 ||
    Number(currentReport.resumen.totalGastos || 0) > 0
  );

  const metrics = useMemo(() => {
    const resumen = currentReport.resumen;

    return [
      { title: 'Facturacion total', value: formatCurrency(resumen.facturacionTotal), detail: 'Ingresos del periodo', icon: TrendingUp, tone: 'blue' },
      { title: 'Cobrado real', value: formatCurrency(resumen.cobradoReal), detail: 'Confirmado', icon: HandCoins, tone: 'green' },
      { title: 'Pendiente de cobro', value: formatCurrency(resumen.pendienteCobro), detail: 'Por cobrar', icon: CalendarClock, tone: 'amber' },
      { title: 'Gastos', value: formatCurrency(resumen.totalGastos), detail: 'Costes del periodo', icon: TrendingDown, tone: 'red' },
      { title: 'Saldo real', value: formatCurrency(resumen.saldoReal), detail: 'Cobrado menos gastos', icon: CircleDollarSign, tone: Number(resumen.saldoReal) >= 0 ? 'green' : 'red' },
      { title: 'Saldo previsto', value: formatCurrency(resumen.saldoPrevisto), detail: 'Facturacion menos gastos', icon: FileText, tone: Number(resumen.saldoPrevisto) >= 0 ? 'cyan' : 'red' },
      { title: 'Neumaticos vendidos', value: formatNumber(resumen.neumaticosVendidos), detail: 'Unidades', icon: Wrench, tone: 'violet' },
      { title: 'Ingresos vencidos', value: formatNumber(resumen.ingresosVencidosCount), detail: 'Pendientes vencidos', icon: AlertTriangle, tone: Number(resumen.ingresosVencidosCount) > 0 ? 'red' : 'green' }
    ];
  }, [currentReport]);

  const loadTalleres = async () => {
    setTalleresLoading(true);
    setTalleresError('');

    try {
      const data = await getTalleres();
      setTalleres(Array.isArray(data) ? data : []);
    } catch (requestError) {
      logError('talleres', requestError);
      setTalleres([]);
      setTalleresError('No se pudieron cargar los talleres.');
    } finally {
      setTalleresLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const handleGenerate = async () => {
    setError('');

    if (!filters.tallerId || !filters.fechaInicio || !filters.fechaFin) {
      setReport(null);
      setError('Selecciona un taller y un rango de fechas para generar el reporte.');
      return;
    }

    setLoading(true);

    try {
      const data = await getReporteResumen(cleanFilters(filters));
      setReport({
        ...emptyReport,
        ...(data || {}),
        resumen: {
          ...emptyReport.resumen,
          ...(data?.resumen || {})
        },
        ingresos: Array.isArray(data?.ingresos) ? data.ingresos : [],
        gastos: Array.isArray(data?.gastos) ? data.gastos : [],
        pendientes: Array.isArray(data?.pendientes) ? data.pendientes : [],
        ingresosPorCategoria: Array.isArray(data?.ingresosPorCategoria) ? data.ingresosPorCategoria : [],
        gastosPorCategoria: Array.isArray(data?.gastosPorCategoria) ? data.gastosPorCategoria : []
      });
    } catch (requestError) {
      logError('reporte', requestError);
      setReport(null);
      setError(getApiMessage(requestError, 'No se pudo generar el reporte.'));
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFilters(initialFilters);
    setReport(null);
    setError('');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="module-page reportes-page">
      <section className="module-toolbar report-actions">
        <div>
          <p className="eyebrow">Reportes financieros</p>
          <h2>Reportes</h2>
          <p>Consulta el resultado por taller y prepara una vista lista para imprimir o guardar como PDF.</p>
        </div>
        <button className="primary-button print-button" type="button" onClick={handlePrint} disabled={!hasReport}>
          <Printer size={17} />
          <span>Exportar PDF</span>
        </button>
      </section>

      <section className="filter-bar report-filters" aria-label="Filtros de reportes">
        <label>
          <span>Taller</span>
          <select value={filters.tallerId} onChange={(event) => handleFilterChange('tallerId', event.target.value)}>
            <option value="">Selecciona un taller</option>
            {talleres.map((taller) => (
              <option key={getTallerId(taller)} value={getTallerId(taller)}>
                {getTallerName(taller)}
              </option>
            ))}
          </select>
          {talleresLoading ? <small className="field-message">Cargando talleres...</small> : null}
          {talleresError ? <small className="field-message error-text">{talleresError}</small> : null}
        </label>
        <label>
          <span>Fecha inicio</span>
          <input type="date" value={filters.fechaInicio} onChange={(event) => handleFilterChange('fechaInicio', event.target.value)} />
        </label>
        <label>
          <span>Fecha fin</span>
          <input type="date" value={filters.fechaFin} onChange={(event) => handleFilterChange('fechaFin', event.target.value)} />
        </label>
        <div className="filter-actions">
          <button className="primary-button" type="button" onClick={handleGenerate} disabled={loading}>
            <SlidersHorizontal size={17} />
            <span>{loading ? 'Generando...' : 'Generar reporte'}</span>
          </button>
          <button className="ghost-button" type="button" onClick={handleClear} disabled={loading}>
            <RotateCcw size={17} />
            <span>Limpiar</span>
          </button>
        </div>
      </section>

      {error ? <div className="alert-error">{error}</div> : null}
      {!hasReport && !error ? <div className="info-panel">Selecciona un taller y un rango de fechas para generar el reporte.</div> : null}

      {loading ? <div className="loading-panel">Generando reporte financiero...</div> : null}

      {hasReport ? (
        <section className="report-preview">
          <div className="report-header">
            <div>
              <p className="eyebrow">Taller Control</p>
              <h2>Resumen financiero</h2>
              <p>{getTallerName(selectedTaller)} - {formatDate(filters.fechaInicio)} - {formatDate(filters.fechaFin)}</p>
            </div>
            <div className="report-stamp">
              <span>Generado</span>
              <strong>{formatDate(new Date())}</strong>
            </div>
          </div>

          {!hasAnyData ? <div className="info-panel">No hay datos para el periodo seleccionado.</div> : null}

          <section className="metric-grid secondary-grid report-metrics">
            {metrics.map((metric) => (
              <MetricCard key={metric.title} {...metric} />
            ))}
          </section>

          <ReportTable
            title="Ingresos por categoria"
            columns={['Categoria', 'Cantidad', 'Total ingresado']}
            rows={currentReport.ingresosPorCategoria}
            emptyText="Sin datos por categoria para este periodo."
            renderRow={(row) => (
              <tr key={row.categoria}>
                <td>{row.categoria || '-'}</td>
                <td>{formatNumber(row.cantidad)}</td>
                <td>{formatCurrency(row.total)}</td>
              </tr>
            )}
          />

          <ReportTable
            title="Gastos por categoria"
            columns={['Categoria', 'Cantidad', 'Total gastado']}
            rows={currentReport.gastosPorCategoria}
            emptyText="Sin datos por categoria para este periodo."
            renderRow={(row) => (
              <tr key={row.categoria}>
                <td>{row.categoria || '-'}</td>
                <td>{formatNumber(row.cantidad)}</td>
                <td>{formatCurrency(row.total)}</td>
              </tr>
            )}
          />

          <ReportTable
            title="Ingresos del periodo"
            columns={['Fecha', 'Descripcion', 'Cliente', 'Monto', 'Metodo pago', 'Estado', 'Fecha prevista', 'Fecha real']}
            rows={currentReport.ingresos}
            emptyText="No hay ingresos en el periodo."
            renderRow={(ingreso) => (
              <tr key={ingreso.IDIngreso}>
                <td>{formatDate(ingreso.Fecha)}</td>
                <td>{ingreso.Descripcion || '-'}</td>
                <td>{ingreso.Cliente || '-'}</td>
                <td>{formatCurrency(ingreso.Monto)}</td>
                <td>{ingreso.TipoPago || '-'}</td>
                <td><span className={`status-badge ${normalizeStatus(ingreso.EstadoPago)}`}>{ingreso.EstadoPago || 'CONFIRMADO'}</span></td>
                <td>{formatDate(ingreso.FechaPagoPrevista)}</td>
                <td>{formatDate(ingreso.FechaPagoReal)}</td>
              </tr>
            )}
          />

          <ReportTable
            title="Gastos del periodo"
            columns={['Fecha', 'Descripcion', 'Monto', 'Metodo pago', 'Tipo gasto']}
            rows={currentReport.gastos}
            emptyText="No hay gastos en el periodo."
            renderRow={(gasto) => (
              <tr key={gasto.IDGasto}>
                <td>{formatDate(gasto.Fecha)}</td>
                <td>{gasto.Descripcion || '-'}</td>
                <td>{formatCurrency(gasto.Monto)}</td>
                <td>{gasto.TipoPago || '-'}</td>
                <td>{gasto.TipoGasto || '-'}</td>
              </tr>
            )}
          />

          {currentReport.pendientes.length > 0 ? (
            <ReportTable
              title="Pendientes de cobro"
              columns={['Cliente', 'Descripcion', 'Monto', 'Fecha prevista', 'Estado']}
              rows={currentReport.pendientes}
              emptyText=""
              renderRow={(pendiente) => (
                <tr key={pendiente.IDIngreso}>
                  <td>{pendiente.Cliente || '-'}</td>
                  <td>{pendiente.Descripcion || '-'}</td>
                  <td>{formatCurrency(pendiente.Monto)}</td>
                  <td>{formatDate(pendiente.FechaPagoPrevista)}</td>
                  <td>
                    <span className={`status-badge ${Number(pendiente.diasVencido) > 0 ? 'vencido' : 'pendiente'}`}>
                      {Number(pendiente.diasVencido) > 0 ? `Vencido ${pendiente.diasVencido} dias` : 'Pendiente'}
                    </span>
                  </td>
                </tr>
              )}
            />
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function ReportTable({ title, columns, rows, emptyText, renderRow }) {
  return (
    <section className="table-panel report-section">
      <div className="panel-heading">
        <h2>{title}</h2>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((column) => <th key={column}>{column}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td className="empty-row" colSpan={columns.length}>{emptyText}</td></tr>
            ) : rows.map(renderRow)}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function cleanFilters(filters) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== '' && value !== null && value !== undefined)
  );
}

function getTallerId(taller) {
  return taller?.IDTaller ?? taller?.idTaller ?? taller?.tallerId ?? taller?.id ?? taller?.Id;
}

function getTallerName(taller) {
  if (!taller) return 'Taller seleccionado';
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

export default Reportes;
