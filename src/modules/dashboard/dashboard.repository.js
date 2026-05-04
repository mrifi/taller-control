const { getPool, sql } = require('../../config/db');
const AppError = require('../../utils/AppError');

const getResumen = async ({ tallerId, fechaInicio, fechaFin }) => {
  const params = {
    IDTaller: tallerId ?? null,
    FechaInicio: fechaInicio ?? null,
    FechaFin: fechaFin ?? null
  };

  if (params.IDTaller === null || params.IDTaller === undefined) {
    throw new AppError('El parametro tallerId es obligatorio para consultar el dashboard', 400);
  }

  const pool = await getPool();
  const [ingresosResult, gastosResult, metodosPagoResult, cobrosResult, ingresosCategoriaResult, gastosCategoriaResult] = await Promise.all([
    executeResumenProcedure(pool, 'dbo.IngresoResumen_Entre_Fechas', params),
    executeResumenProcedure(pool, 'dbo.GastoResumen_Entre_Fechas', params),
    executeMetodosPagoQuery(pool, params),
    executeCobrosQuery(pool, params),
    executeIngresosPorCategoriaQuery(pool, params),
    executeGastosPorCategoriaQuery(pool, params)
  ]);

  const ingresos = ingresosResult.recordset || [];
  const gastos = gastosResult.recordset || [];
  const movimientos = metodosPagoResult.recordset || [];
  const cobros = cobrosResult.recordset?.[0] || {};
  const movimientosIngreso = movimientos.filter((row) => normalize(row.Movimiento) === 'ingreso');
  const movimientosGasto = movimientos.filter((row) => normalize(row.Movimiento) === 'gasto');
  const facturacionTotal = getNumber(cobros.FacturacionTotal);
  const cobradoReal = getNumber(cobros.CobradoReal);
  const pendienteCobro = getNumber(cobros.PendienteCobro);
  const totalGastos = sumAmount(gastos);
  const saldoReal = cobradoReal - totalGastos;
  const saldoPrevisto = facturacionTotal - totalGastos;

  return {
    totalIngresos: facturacionTotal,
    totalGastos,
    // Compatibilidad: saldo representa el saldo previsto, incluyendo ingresos pendientes.
    saldo: saldoPrevisto,
    neumaticosVendidos: getNumber(cobros.NeumaticosVendidos) || sumQuantity(ingresos),
    ingresosEfectivo: sumByPaymentMethod(movimientosIngreso, 'Efectivo'),
    ingresosTarjeta: sumByPaymentMethod(movimientosIngreso, 'Tarjeta'),
    ingresosTransferencia: sumByPaymentMethod(movimientosIngreso, 'Transferencia'),
    ingresosBizum: sumByPaymentMethod(movimientosIngreso, 'Bizum'),
    gastosEfectivo: sumByPaymentMethod(movimientosGasto, 'Efectivo'),
    gastosTarjeta: sumByPaymentMethod(movimientosGasto, 'Tarjeta'),
    gastosTransferencia: sumByPaymentMethod(movimientosGasto, 'Transferencia'),
    gastosBizum: sumByPaymentMethod(movimientosGasto, 'Bizum'),
    facturacionTotal,
    cobradoReal,
    pendienteCobro,
    saldoReal,
    saldoPrevisto,
    ingresosPendientesCount: getNumber(cobros.IngresosPendientesCount),
    ingresosVencidosCount: getNumber(cobros.IngresosVencidosCount),
    ingresosPorCategoria: normalizeCategoryRows(ingresosCategoriaResult.recordset),
    gastosPorCategoria: normalizeCategoryRows(gastosCategoriaResult.recordset)
  };
};

const executeResumenProcedure = async (pool, procedureName, params) => {
  console.log({
    procedureName,
    params
  });

  const request = pool.request()
    .input('FechaInicio', sql.Date, params.FechaInicio)
    .input('FechaFin', sql.Date, params.FechaFin)
    .input('IDTaller', sql.Int, params.IDTaller);

  const result = await request.execute(procedureName);
  logRepositoryCall(procedureName, params, result);

  return result;
};

const executeCobrosQuery = async (pool, params) => {
  const result = await pool.request()
    .input('FechaInicio', sql.Date, params.FechaInicio)
    .input('FechaFin', sql.Date, params.FechaFin)
    .input('IDTaller', sql.Int, params.IDTaller)
    .query(`
      SELECT
        COALESCE(SUM(CASE WHEN EstadoPago = 'CONFIRMADO' THEN Monto ELSE 0 END), 0) AS CobradoReal,
        COALESCE(SUM(CASE WHEN EstadoPago = 'PENDIENTE' THEN Monto ELSE 0 END), 0) AS PendienteCobro,
        COALESCE(SUM(Monto), 0) AS FacturacionTotal,
        COALESCE(SUM(Cantidad), 0) AS NeumaticosVendidos,
        COALESCE(SUM(CASE WHEN EstadoPago = 'PENDIENTE' THEN 1 ELSE 0 END), 0) AS IngresosPendientesCount,
        COALESCE(SUM(CASE WHEN EstadoPago = 'PENDIENTE' AND FechaPagoPrevista < CAST(GETDATE() AS DATE) THEN 1 ELSE 0 END), 0) AS IngresosVencidosCount
      FROM dbo.Ingreso
      WHERE (@FechaInicio IS NULL OR Fecha >= @FechaInicio)
        AND (@FechaFin IS NULL OR Fecha <= @FechaFin)
        AND IDTaller = @IDTaller
    `);

  logRepositoryCall('SELECT dashboard cobros dbo.Ingreso', params, result);

  return result;
};

const executeMetodosPagoQuery = async (pool, params) => {
  const result = await pool.request()
    .input('FechaInicio', sql.Date, params.FechaInicio)
    .input('FechaFin', sql.Date, params.FechaFin)
    .input('IDTaller', sql.Int, params.IDTaller)
    .query(`
      SELECT
        'INGRESO' AS Movimiento,
        TipoPago,
        COALESCE(SUM(Monto), 0) AS Monto
      FROM dbo.Ingreso
      WHERE (@FechaInicio IS NULL OR Fecha >= @FechaInicio)
        AND (@FechaFin IS NULL OR Fecha <= @FechaFin)
        AND IDTaller = @IDTaller
      GROUP BY TipoPago

      UNION ALL

      SELECT
        'GASTO' AS Movimiento,
        TipoPago,
        COALESCE(SUM(Monto), 0) AS Monto
      FROM dbo.Gasto
      WHERE (@FechaInicio IS NULL OR Fecha >= @FechaInicio)
        AND (@FechaFin IS NULL OR Fecha <= @FechaFin)
        AND IDTaller = @IDTaller
      GROUP BY TipoPago
    `);

  logRepositoryCall('SELECT dashboard metodos pago', params, result);

  return result;
};

const executeIngresosPorCategoriaQuery = async (pool, params) => {
  const result = await pool.request()
    .input('FechaInicio', sql.Date, params.FechaInicio)
    .input('FechaFin', sql.Date, params.FechaFin)
    .input('IDTaller', sql.Int, params.IDTaller)
    .query(`
      SELECT
        ti.Denominacion AS categoria,
        COALESCE(SUM(i.Cantidad), 0) AS cantidad,
        COALESCE(SUM(i.Monto), 0) AS total
      FROM dbo.Ingreso i
      INNER JOIN dbo.TipoIngreso ti ON ti.IDTipoIngreso = i.IDTipoIngreso
      WHERE (@FechaInicio IS NULL OR i.Fecha >= @FechaInicio)
        AND (@FechaFin IS NULL OR i.Fecha <= @FechaFin)
        AND i.IDTaller = @IDTaller
      GROUP BY ti.Denominacion
      ORDER BY total DESC
    `);

  logRepositoryCall('SELECT dashboard ingresos por categoria', params, result);

  return result;
};

const executeGastosPorCategoriaQuery = async (pool, params) => {
  const result = await pool.request()
    .input('FechaInicio', sql.Date, params.FechaInicio)
    .input('FechaFin', sql.Date, params.FechaFin)
    .input('IDTaller', sql.Int, params.IDTaller)
    .query(`
      SELECT
        tg.Denominacion AS categoria,
        COALESCE(SUM(g.Cantidad), 0) AS cantidad,
        COALESCE(SUM(g.Monto), 0) AS total
      FROM dbo.Gasto g
      INNER JOIN dbo.TipoGasto tg ON tg.IDTipoGasto = g.IDTipoGasto
      WHERE (@FechaInicio IS NULL OR g.Fecha >= @FechaInicio)
        AND (@FechaFin IS NULL OR g.Fecha <= @FechaFin)
        AND g.IDTaller = @IDTaller
      GROUP BY tg.Denominacion
      ORDER BY total DESC
    `);

  logRepositoryCall('SELECT dashboard gastos por categoria', params, result);

  return result;
};

const sumAmount = (rows = []) => rows.reduce((total, row) => total + getAmount(row), 0);

const sumQuantity = (rows = []) => rows.reduce((total, row) => total + getNumber(row.Cantidad), 0);

const sumByPaymentMethod = (rows = [], paymentMethod) => rows
  .filter((row) => normalize(row.TipoPago) === normalize(paymentMethod))
  .reduce((total, row) => total + getMovementAmount(row), 0);

const getAmount = (row) => getNumber(row.Total);

const getMovementAmount = (row) => getNumber(row.Monto);

const getNumber = (value) => {
  const numberValue = Number(value ?? 0);

  return Number.isNaN(numberValue) ? 0 : numberValue;
};

const normalizeCategoryRows = (rows = []) => rows.map((row) => ({
  categoria: row.categoria || row.Categoria || row.Denominacion || 'Sin categoria',
  cantidad: getNumber(row.cantidad ?? row.Cantidad),
  total: getNumber(row.total ?? row.Total)
}));

const normalize = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

const logRepositoryCall = (procedureName, params, result) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log({
      procedureName,
      params: {
        ...params,
        tipoIDTaller: typeof params.IDTaller,
        tipoFechaInicio: Object.prototype.toString.call(params.FechaInicio),
        tipoFechaFin: Object.prototype.toString.call(params.FechaFin)
      },
      recordsetLength: result.recordset?.length || 0,
      recordset: result.recordset || []
    });
  }
};

module.exports = {
  getResumen
};
