import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  BadgeEuro,
  Bell,
  CalendarClock,
  CircleDollarSign,
  CreditCard,
  HandCoins,
  Landmark,
  ReceiptText,
  Search,
  ShieldCheck,
  Smartphone,
  TrendingDown,
  TrendingUp,
  Wallet,
  Wrench
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import DataTable from '../components/Dashboard/DataTable.jsx';
import FilterBar from '../components/Dashboard/FilterBar.jsx';
import MetricCard from '../components/Dashboard/MetricCard.jsx';
import PaymentChart from '../components/Dashboard/PaymentChart.jsx';
import { getUser } from '../services/authService.js';
import { getDashboard } from '../services/dashboardService.js';
import { getGastos } from '../services/gastosService.js';
import { getIngresos } from '../services/ingresosService.js';
import { getTalleres } from '../services/talleresService.js';

const initialFilters = {
  tallerId: '',
  fechaInicio: '',
  fechaFin: ''
};

const emptySummary = {
  totalIngresos: 0,
  totalGastos: 0,
  saldo: 0,
  neumaticosVendidos: 0,
  ingresosEfectivo: 0,
  ingresosTarjeta: 0,
  ingresosTransferencia: 0,
  ingresosBizum: 0,
  gastosEfectivo: 0,
  gastosTarjeta: 0,
  gastosTransferencia: 0,
  gastosBizum: 0,
  facturacionTotal: 0,
  cobradoReal: 0,
  pendienteCobro: 0,
  saldoReal: 0,
  saldoPrevisto: 0,
  ingresosPendientesCount: 0,
  ingresosVencidosCount: 0,
  ingresosPorCategoria: [],
  gastosPorCategoria: []
};

function Dashboard() {
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [summary, setSummary] = useState(emptySummary);
  const [ingresos, setIngresos] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [talleres, setTalleres] = useState([]);
  const [talleresLoading, setTalleresLoading] = useState(false);
  const [talleresError, setTalleresError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const hasSelectedTaller = Boolean(appliedFilters.tallerId);
  const user = getUser();

  useEffect(() => {
    loadTalleres();
  }, []);

  useEffect(() => {
    if (!appliedFilters.tallerId) {
      setSummary(emptySummary);
      setIngresos([]);
      setGastos([]);
      setError('');
      setLoading(false);
      return;
    }

    loadDashboard(appliedFilters);
  }, [appliedFilters]);

  const loadTalleres = async () => {
    setTalleresLoading(true);
    setTalleresError('');

    try {
      const talleresData = await getTalleres();
      setTalleres(Array.isArray(talleresData) ? talleresData : []);
    } catch (requestError) {
      logApiError('talleres', requestError);
      setTalleres([]);
      setTalleresError('No se pudieron cargar los talleres.');
    } finally {
      setTalleresLoading(false);
    }
  };

  const loadDashboard = async (currentFilters) => {
    setLoading(true);
    setError('');

    try {
      const params = cleanFilters(currentFilters);
      const dashboardData = await getDashboard(params);

      setSummary({ ...emptySummary, ...(dashboardData || {}) });

      const [ingresosResult, gastosResult] = await Promise.allSettled([
        getIngresos(params),
        getGastos(params)
      ]);

      setIngresos(getSettledArray(ingresosResult, 'ingresos'));
      setGastos(getSettledArray(gastosResult, 'gastos'));
    } catch (requestError) {
      logApiError('dashboard', requestError);
      setError('No se pudieron cargar los datos del dashboard.');
      setSummary(emptySummary);
      setIngresos([]);
      setGastos([]);
    } finally {
      setLoading(false);
    }
  };

  const metrics = useMemo(() => ([
    {
      title: 'Facturacion total',
      value: formatCurrency(summary.facturacionTotal ?? summary.totalIngresos),
      detail: 'Confirmada y pendiente',
      icon: TrendingUp,
      tone: 'blue'
    },
    {
      title: 'Cobrado real',
      value: formatCurrency(summary.cobradoReal),
      detail: 'Ingresos confirmados',
      icon: HandCoins,
      tone: 'green'
    },
    {
      title: 'Pendiente de cobro',
      value: formatCurrency(summary.pendienteCobro),
      detail: 'Ingresos pendientes',
      icon: CalendarClock,
      tone: 'amber'
    },
    {
      title: 'Gastos totales',
      value: formatCurrency(summary.totalGastos),
      detail: 'Costes registrados',
      icon: TrendingDown,
      tone: 'red'
    },
    {
      title: 'Saldo real',
      value: formatCurrency(summary.saldoReal),
      detail: 'Cobrado menos gastos',
      icon: CircleDollarSign,
      tone: Number(summary.saldoReal) >= 0 ? 'green' : 'red'
    },
    {
      title: 'Saldo previsto',
      value: formatCurrency(summary.saldoPrevisto ?? summary.saldo),
      detail: 'Facturacion menos gastos',
      icon: BadgeEuro,
      tone: Number(summary.saldoPrevisto ?? summary.saldo) >= 0 ? 'cyan' : 'red'
    },
    {
      title: 'Ingresos pendientes',
      value: formatNumber(summary.ingresosPendientesCount),
      detail: 'Operaciones por cobrar',
      icon: ReceiptText,
      tone: 'amber'
    },
    {
      title: 'Ingresos vencidos',
      value: formatNumber(summary.ingresosVencidosCount),
      detail: 'Pendientes fuera de fecha',
      icon: AlertTriangle,
      tone: 'red'
    }
  ]), [summary]);

  const mainMetrics = metrics.slice(0, 4);
  const finalMetrics = metrics.slice(4);

  const secondaryMetrics = useMemo(() => ([
    { title: 'Ingresos en efectivo', value: formatCurrency(summary.ingresosEfectivo), icon: Banknote, tone: 'green' },
    { title: 'Ingresos con tarjeta', value: formatCurrency(summary.ingresosTarjeta), icon: CreditCard, tone: 'blue' },
    { title: 'Ingresos por transferencia', value: formatCurrency(summary.ingresosTransferencia), icon: Landmark, tone: 'cyan' },
    { title: 'Ingresos por Bizum', value: formatCurrency(summary.ingresosBizum), icon: Smartphone, tone: 'violet' },
    { title: 'Gastos en efectivo', value: formatCurrency(summary.gastosEfectivo), icon: Wallet, tone: 'red' },
    { title: 'Gastos con tarjeta', value: formatCurrency(summary.gastosTarjeta), icon: CreditCard, tone: 'red' },
    { title: 'Gastos por transferencia', value: formatCurrency(summary.gastosTransferencia), icon: Landmark, tone: 'red' },
    { title: 'Gastos por Bizum', value: formatCurrency(summary.gastosBizum), icon: ReceiptText, tone: 'red' }
  ]), [summary]);

  const ingresosPorMetodo = [
    { name: 'Efectivo', value: Number(summary.ingresosEfectivo || 0) },
    { name: 'Tarjeta', value: Number(summary.ingresosTarjeta || 0) },
    { name: 'Transferencia', value: Number(summary.ingresosTransferencia || 0) },
    { name: 'Bizum', value: Number(summary.ingresosBizum || 0) }
  ];

  const gastosPorMetodo = [
    { name: 'Efectivo', value: Number(summary.gastosEfectivo || 0) },
    { name: 'Tarjeta', value: Number(summary.gastosTarjeta || 0) },
    { name: 'Transferencia', value: Number(summary.gastosTransferencia || 0) },
    { name: 'Bizum', value: Number(summary.gastosBizum || 0) }
  ];

  const balanceData = [
    { name: 'Saldo real', value: Math.abs(Number(summary.saldoReal || 0)) },
    { name: 'Saldo previsto', value: Math.abs(Number((summary.saldoPrevisto ?? summary.saldo) || 0)) }
  ];

  const cobrosData = [
    { name: 'Cobrado real', value: Number(summary.cobradoReal || 0) },
    { name: 'Pendiente', value: Number(summary.pendienteCobro || 0) }
  ];

  const ingresosCategoriaData = getCategoryChartData(summary.ingresosPorCategoria);
  const gastosCategoriaData = getCategoryChartData(summary.gastosPorCategoria);
  const selectedTaller = talleres.find((taller) => String(getTallerId(taller)) === String(filters.tallerId || appliedFilters.tallerId));
  const greetingName = user?.nombre || selectedTaller ? user?.nombre || getTallerName(selectedTaller) : 'Taller Control';
  const ingresosVsGastosData = [
    { name: 'Ingresos', ingresos: Number(summary.facturacionTotal ?? summary.totalIngresos ?? 0), gastos: 0 },
    { name: 'Gastos', ingresos: 0, gastos: Number(summary.totalGastos || 0) }
  ];
  const monthlyData = getMovementTrend(ingresos, gastos);
  const pendingRows = getPendingRows(ingresos);

  const tyreProgress = Math.min(Number(summary.neumaticosVendidos || 0), 200);
  const tyrePercent = Math.round((tyreProgress / 200) * 100);

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const handleApply = () => {
    if (!filters.tallerId) {
      setAppliedFilters(initialFilters);
      setError('');
      return;
    }

    setAppliedFilters(filters);
  };

  const handleClear = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
  };

  return (
    <div className="dashboard-page dashboard-premium">
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <p className="eyebrow">Resumen financiero</p>
          <h2>Buenos dias, {greetingName}</h2>
          <p>Aqui tienes el resumen financiero de tu taller.</p>
        </div>

        <div className="dashboard-hero-actions">
          <div className="dashboard-search">
            <Search size={17} />
            <span>Buscar movimientos</span>
          </div>
          <button className="dashboard-icon-button" type="button" aria-label="Notificaciones">
            <Bell size={18} />
          </button>
          {user ? (
            <div className="dashboard-user-card">
              <strong>{user.nombre}</strong>
              <span>{user.rol}</span>
            </div>
          ) : null}
        </div>
      </section>

      <div className="dashboard-filter-card">
        <FilterBar
          filters={filters}
          talleres={talleres}
          loading={loading}
          talleresLoading={talleresLoading}
          talleresError={talleresError}
          onChange={handleFilterChange}
          onApply={handleApply}
          onClear={handleClear}
        />
      </div>

      {error ? <div className="alert-error">{error}</div> : null}
      {!hasSelectedTaller ? <div className="info-panel">Selecciona un taller para ver el dashboard.</div> : null}

      <section className="metric-grid dashboard-kpi-grid">
        {mainMetrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </section>

      {loading ? (
        <div className="loading-panel">Cargando datos financieros...</div>
      ) : hasSelectedTaller ? (
        <>
          <section className="dashboard-main-grid">
            <FinancialBars title="Ingresos vs gastos" data={ingresosVsGastosData} />
            <PaymentChart title="Metodos de ingreso" data={ingresosPorMetodo} />
            <TrendChart title="Evolucion mensual" data={monthlyData} />
          </section>

          <section className="charts-grid dashboard-secondary-charts">
            <PaymentChart title="Cobrado real vs pendiente" data={cobrosData} />
            <PaymentChart title="Saldo real vs previsto" data={balanceData} />
            <PaymentChart title="Gastos por metodo de pago" data={gastosPorMetodo} />
            <section className="chart-panel tyre-panel">
              <div className="panel-heading">
                <h2>Neumaticos vendidos</h2>
              </div>
              <div className="tyre-visual">
                <div className="tyre-ring" style={{ '--progress': `${tyrePercent}%` }}>
                  <span>{formatNumber(summary.neumaticosVendidos)}</span>
                </div>
                <p>Objetivo visual de referencia: 200 unidades</p>
              </div>
            </section>
          </section>

          <section className="metric-grid dashboard-summary-grid">
            {finalMetrics.map((metric) => (
              <MetricCard key={metric.title} {...metric} />
            ))}
          </section>

          <section className="metric-grid dashboard-payment-grid">
            {secondaryMetrics.map((metric) => (
              <MetricCard key={metric.title} {...metric} />
            ))}
          </section>

          <section className="category-insights-grid">
            <CategoryInsight
              title="Ventas por categoria"
              chartTitle="Total ingresado por categoria"
              rows={summary.ingresosPorCategoria}
              chartData={ingresosCategoriaData}
              totalLabel="Total ingresado"
            />
            <CategoryInsight
              title="Gastos por categoria"
              chartTitle="Total gastado por categoria"
              rows={summary.gastosPorCategoria}
              chartData={gastosCategoriaData}
              totalLabel="Total gastado"
            />
          </section>

          <section className="tables-grid">
            <DataTable title="Ultimos ingresos" rows={ingresos} />
            <DataTable title="Ultimos gastos" rows={gastos} />
            <OperationList title="Pendientes de cobro" rows={pendingRows} emptyText="No hay pendientes para este periodo." />
          </section>
        </>
      ) : null}
    </div>
  );
}

function FinancialBars({ title, data }) {
  const hasData = data.some((item) => Number(item.ingresos || item.gastos) > 0);

  return (
    <section className="chart-panel featured-chart-panel">
      <div className="panel-heading premium-panel-heading">
        <div>
          <h2>{title}</h2>
          <span>Comparativa del periodo seleccionado</span>
        </div>
        <ShieldCheck size={18} />
      </div>
      <div className="chart-area">
        {!hasData ? (
          <div className="empty-chart">Sin datos para mostrar</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(148, 163, 184, 0.22)" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={58} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="ingresos" radius={[8, 8, 0, 0]} fill="#0ea5e9" />
              <Bar dataKey="gastos" radius={[8, 8, 0, 0]} fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

function TrendChart({ title, data }) {
  const hasData = data.some((item) => Number(item.ingresos || item.gastos) > 0);

  return (
    <section className="chart-panel">
      <div className="panel-heading premium-panel-heading">
        <div>
          <h2>{title}</h2>
          <span>Lectura rapida por fechas recientes</span>
        </div>
        <ArrowUpRight size={18} />
      </div>
      <div className="chart-area">
        {!hasData ? (
          <div className="empty-chart">Sin datos para mostrar</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(148, 163, 184, 0.22)" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={48} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Area type="monotone" dataKey="ingresos" stroke="#0ea5e9" fill="url(#incomeGradient)" strokeWidth={3} />
              <Area type="monotone" dataKey="gastos" stroke="#ef4444" fill="url(#expenseGradient)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

function OperationList({ title, rows, emptyText }) {
  return (
    <section className="table-panel operation-list-panel">
      <div className="panel-heading">
        <h2>{title}</h2>
      </div>
      <div className="operation-list">
        {rows.length === 0 ? (
          <div className="empty-chart compact-empty">{emptyText}</div>
        ) : rows.slice(0, 6).map((row, index) => (
          <article className="operation-row" key={row.IDIngreso || row.id || `${title}-${index}`}>
            <div>
              <strong>{row.Cliente || row.cliente || 'Cliente pendiente'}</strong>
              <span>{row.Descripcion || row.descripcion || 'Ingreso pendiente'}</span>
            </div>
            <div className="operation-amount">
              <strong>{formatCurrency(row.Monto || row.monto || 0)}</strong>
              <span className={`status-badge ${isOverdue(row) ? 'vencido' : 'pendiente'}`}>
                {isOverdue(row) ? 'Vencido' : 'Pendiente'}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function CategoryInsight({ title, chartTitle, rows = [], chartData = [], totalLabel }) {
  const safeRows = Array.isArray(rows) ? rows : [];

  return (
    <section className="category-insight">
      <PaymentChart title={chartTitle} data={chartData} />
      <section className="table-panel">
        <div className="panel-heading">
          <h2>{title}</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Cantidad</th>
                <th>{totalLabel}</th>
              </tr>
            </thead>
            <tbody>
              {safeRows.length === 0 ? (
                <tr><td colSpan="3" className="empty-row">Sin datos por categoria para este periodo.</td></tr>
              ) : safeRows.slice(0, 8).map((row) => (
                <tr key={row.categoria}>
                  <td>{row.categoria || '-'}</td>
                  <td>{formatNumber(row.cantidad)}</td>
                  <td>{formatCurrency(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function getMovementTrend(ingresos = [], gastos = []) {
  const groups = new Map();

  ingresos.forEach((row) => {
    const key = getShortDate(row.Fecha || row.fecha || row.createdAt);
    const current = groups.get(key) || { name: key, ingresos: 0, gastos: 0 };
    current.ingresos += Number(row.Monto || row.monto || row.Total || row.total || 0);
    groups.set(key, current);
  });

  gastos.forEach((row) => {
    const key = getShortDate(row.Fecha || row.fecha || row.createdAt);
    const current = groups.get(key) || { name: key, ingresos: 0, gastos: 0 };
    current.gastos += Number(row.Monto || row.monto || row.Total || row.total || 0);
    groups.set(key, current);
  });

  return Array.from(groups.values()).slice(0, 8).reverse();
}

function getShortDate(value) {
  if (!value) {
    return 'Sin fecha';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(date);
}

function getPendingRows(rows = []) {
  return (Array.isArray(rows) ? rows : []).filter((row) => (
    String(row.EstadoPago || row.estadoPago || '').toUpperCase() === 'PENDIENTE'
  ));
}

function isOverdue(row) {
  const value = row.FechaPagoPrevista || row.fechaPagoPrevista;

  if (!value) {
    return false;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date < new Date();
}

function getTallerId(taller) {
  return taller?.IDTaller ?? taller?.idTaller ?? taller?.tallerId ?? taller?.id ?? taller?.Id;
}

function getTallerName(taller) {
  const id = getTallerId(taller);

  return (
    taller?.Denominacion ||
    taller?.denominacion ||
    taller?.Nombre ||
    taller?.nombre ||
    taller?.nombreTaller ||
    taller?.descripcion ||
    `Taller ${id}`
  );
}

function getCategoryChartData(rows = []) {
  return (Array.isArray(rows) ? rows : [])
    .slice(0, 8)
    .map((row) => ({
      name: row.categoria || 'Sin categoria',
      value: Number(row.total || 0)
    }));
}

function cleanFilters(filters) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== '' && value !== null && value !== undefined)
  );
}

function getSettledArray(result, resourceName) {
  if (result.status === 'fulfilled') {
    if (Array.isArray(result.value)) {
      return result.value;
    }

    if (Array.isArray(result.value?.items)) {
      return result.value.items;
    }
  }

  if (result.status === 'rejected') {
    logApiError(resourceName, result.reason);
  }

  return [];
}

function logApiError(resourceName, error) {
  if (import.meta.env.DEV) {
    console.error(`Error cargando ${resourceName}:`, {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
      url: error?.config?.url,
      baseURL: error?.config?.baseURL,
      params: error?.config?.params
    });
  }
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

export default Dashboard;
