const dashboardRepository = require('./dashboard.repository');
const { dashboardQuerySchema } = require('./dashboard.schema');

const getResumen = async (empresaId, filters) => {
  const validatedFilters = dashboardQuerySchema.parse(filters);

  const resumen = await dashboardRepository.getResumen({
    empresaId,
    tallerId: validatedFilters.tallerId ?? null,
    fechaInicio: validatedFilters.fechaInicio ?? null,
    fechaFin: validatedFilters.fechaFin ?? null
  });

  return resumen || {
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
};

module.exports = {
  getResumen
};
