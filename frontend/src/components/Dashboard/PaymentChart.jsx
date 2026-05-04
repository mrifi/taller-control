import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const pieColors = ['#22c55e', '#ef4444', '#38bdf8'];

function PaymentChart({ title, type = 'bar', data, dataKey = 'value' }) {
  const safeData = data.filter((item) => Number(item[dataKey]) > 0);

  return (
    <section className="chart-panel">
      <div className="panel-heading">
        <h2>{title}</h2>
      </div>

      <div className="chart-area">
        {safeData.length === 0 ? (
          <div className="empty-chart">Sin datos para mostrar</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {type === 'pie' ? (
              <PieChart>
                <Pie data={safeData} dataKey={dataKey} nameKey="name" innerRadius={48} outerRadius={82} paddingAngle={3}>
                  {safeData.map((item, index) => (
                    <Cell key={item.name} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            ) : (
              <BarChart data={safeData}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(148, 163, 184, 0.22)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={42} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey={dataKey} radius={[6, 6, 0, 0]} fill="#38bdf8" />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

export default PaymentChart;
