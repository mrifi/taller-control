const { getPool, sql } = require('../../config/db');
const AppError = require('../../utils/AppError');

const obtenerResumen = async ({ empresaId, tallerId, fechaInicio, fechaFin }) => {
  const pool = await getPool();
  const params = {
    IDEmpresa: empresaId,
    IDTaller: tallerId,
    FechaInicio: fechaInicio,
    FechaFin: fechaFin
  };

  await ensureTallerBelongsToEmpresa(pool, params);

  const [resumenResult, ingresosResult, gastosResult, pendientesResult, ingresosCategoriaResult, gastosCategoriaResult] = await Promise.all([
    getResumen(pool, params),
    getIngresos(pool, params),
    getGastos(pool, params),
    getPendientes(pool, params),
    getIngresosPorCategoria(pool, params),
    getGastosPorCategoria(pool, params)
  ]);

  const resumen = resumenResult.recordset?.[0] || {};

  return {
    resumen: {
      facturacionTotal: toNumber(resumen.FacturacionTotal),
      cobradoReal: toNumber(resumen.CobradoReal),
      pendienteCobro: toNumber(resumen.PendienteCobro),
      totalGastos: toNumber(resumen.TotalGastos),
      saldoReal: toNumber(resumen.CobradoReal) - toNumber(resumen.TotalGastos),
      saldoPrevisto: toNumber(resumen.FacturacionTotal) - toNumber(resumen.TotalGastos),
      neumaticosVendidos: toNumber(resumen.NeumaticosVendidos),
      ingresosPendientesCount: toNumber(resumen.IngresosPendientesCount),
      ingresosVencidosCount: toNumber(resumen.IngresosVencidosCount)
    },
    ingresos: ingresosResult.recordset || [],
    gastos: gastosResult.recordset || [],
    pendientes: pendientesResult.recordset || [],
    ingresosPorCategoria: normalizeCategoryRows(ingresosCategoriaResult.recordset),
    gastosPorCategoria: normalizeCategoryRows(gastosCategoriaResult.recordset)
  };
};

const baseRequest = (pool, params) => pool.request()
  .input('IDEmpresa', sql.Int, params.IDEmpresa)
  .input('FechaInicio', sql.Date, params.FechaInicio)
  .input('FechaFin', sql.Date, params.FechaFin)
  .input('IDTaller', sql.Int, params.IDTaller);

const getResumen = async (pool, params) => {
  const result = await baseRequest(pool, params).query(`
    SELECT
      COALESCE(SUM(i.Monto), 0) AS FacturacionTotal,
      COALESCE(SUM(CASE WHEN i.EstadoPago = 'CONFIRMADO' THEN i.Monto ELSE 0 END), 0) AS CobradoReal,
      COALESCE(SUM(CASE WHEN i.EstadoPago = 'PENDIENTE' THEN i.Monto ELSE 0 END), 0) AS PendienteCobro,
      COALESCE(SUM(i.Cantidad), 0) AS NeumaticosVendidos,
      COALESCE(SUM(CASE WHEN i.EstadoPago = 'PENDIENTE' THEN 1 ELSE 0 END), 0) AS IngresosPendientesCount,
      COALESCE(SUM(CASE WHEN i.EstadoPago = 'PENDIENTE' AND i.FechaPagoPrevista < CAST(GETDATE() AS DATE) THEN 1 ELSE 0 END), 0) AS IngresosVencidosCount,
      (
        SELECT COALESCE(SUM(g.Monto), 0)
        FROM dbo.Gasto g
        WHERE g.Fecha >= @FechaInicio
          AND g.Fecha <= @FechaFin
          AND g.IDTaller = @IDTaller
          AND g.IDEmpresa = @IDEmpresa
      ) AS TotalGastos
    FROM dbo.Ingreso i
    WHERE i.Fecha >= @FechaInicio
      AND i.Fecha <= @FechaFin
      AND i.IDTaller = @IDTaller
      AND i.IDEmpresa = @IDEmpresa
  `);

  logRepositoryCall('SELECT reporte resumen', params, result);

  return result;
};

const getIngresos = async (pool, params) => {
  const result = await baseRequest(pool, params).query(`
    SELECT
      i.IDIngreso,
      i.Fecha,
      i.Descripcion,
      i.Cliente,
      i.Monto,
      i.Cantidad,
      i.TipoPago,
      ti.Denominacion AS TipoIngreso,
      i.EstadoPago,
      i.FechaPagoPrevista,
      i.FechaPagoReal
    FROM dbo.Ingreso i
    INNER JOIN dbo.TipoIngreso ti ON ti.IDTipoIngreso = i.IDTipoIngreso
    WHERE i.Fecha >= @FechaInicio
      AND i.Fecha <= @FechaFin
      AND i.IDTaller = @IDTaller
      AND i.IDEmpresa = @IDEmpresa
    ORDER BY i.Fecha DESC, i.IDIngreso DESC
  `);

  logRepositoryCall('SELECT reporte ingresos', params, result);

  return result;
};

const getGastos = async (pool, params) => {
  const result = await baseRequest(pool, params).query(`
    SELECT
      g.IDGasto,
      g.Fecha,
      g.Descripcion,
      g.Monto,
      g.Cantidad,
      g.TipoPago,
      tg.Denominacion AS TipoGasto
    FROM dbo.Gasto g
    INNER JOIN dbo.TipoGasto tg ON tg.IDTipoGasto = g.IDTipoGasto
    WHERE g.Fecha >= @FechaInicio
      AND g.Fecha <= @FechaFin
      AND g.IDTaller = @IDTaller
      AND g.IDEmpresa = @IDEmpresa
    ORDER BY g.Fecha DESC, g.IDGasto DESC
  `);

  logRepositoryCall('SELECT reporte gastos', params, result);

  return result;
};

const getPendientes = async (pool, params) => {
  const result = await baseRequest(pool, params).query(`
    SELECT
      i.IDIngreso,
      i.Fecha,
      i.Descripcion,
      i.Cliente,
      i.Monto,
      i.FechaPagoPrevista,
      CASE
        WHEN i.FechaPagoPrevista < CAST(GETDATE() AS DATE)
          THEN DATEDIFF(DAY, i.FechaPagoPrevista, CAST(GETDATE() AS DATE))
        ELSE 0
      END AS diasVencido
    FROM dbo.Ingreso i
    WHERE i.Fecha >= @FechaInicio
      AND i.Fecha <= @FechaFin
      AND i.IDTaller = @IDTaller
      AND i.IDEmpresa = @IDEmpresa
      AND i.EstadoPago = 'PENDIENTE'
    ORDER BY i.FechaPagoPrevista ASC, i.IDIngreso DESC
  `);

  logRepositoryCall('SELECT reporte pendientes', params, result);

  return result;
};

const getIngresosPorCategoria = async (pool, params) => {
  const result = await baseRequest(pool, params).query(`
    SELECT
      ti.Denominacion AS categoria,
      COALESCE(SUM(i.Cantidad), 0) AS cantidad,
      COALESCE(SUM(i.Monto), 0) AS total
    FROM dbo.Ingreso i
    INNER JOIN dbo.TipoIngreso ti ON ti.IDTipoIngreso = i.IDTipoIngreso
    WHERE i.Fecha >= @FechaInicio
      AND i.Fecha <= @FechaFin
      AND i.IDTaller = @IDTaller
      AND i.IDEmpresa = @IDEmpresa
    GROUP BY ti.Denominacion
    ORDER BY total DESC
  `);

  logRepositoryCall('SELECT reporte ingresos por categoria', params, result);

  return result;
};

const getGastosPorCategoria = async (pool, params) => {
  const result = await baseRequest(pool, params).query(`
    SELECT
      tg.Denominacion AS categoria,
      COALESCE(SUM(g.Cantidad), 0) AS cantidad,
      COALESCE(SUM(g.Monto), 0) AS total
    FROM dbo.Gasto g
    INNER JOIN dbo.TipoGasto tg ON tg.IDTipoGasto = g.IDTipoGasto
    WHERE g.Fecha >= @FechaInicio
      AND g.Fecha <= @FechaFin
      AND g.IDTaller = @IDTaller
      AND g.IDEmpresa = @IDEmpresa
    GROUP BY tg.Denominacion
    ORDER BY total DESC
  `);

  logRepositoryCall('SELECT reporte gastos por categoria', params, result);

  return result;
};

const toNumber = (value) => {
  const numberValue = Number(value ?? 0);

  return Number.isNaN(numberValue) ? 0 : numberValue;
};

const normalizeCategoryRows = (rows = []) => rows.map((row) => ({
  categoria: row.categoria || row.Categoria || row.Denominacion || 'Sin categoria',
  cantidad: toNumber(row.cantidad ?? row.Cantidad),
  total: toNumber(row.total ?? row.Total)
}));

const ensureTallerBelongsToEmpresa = async (pool, params) => {
  const result = await pool.request()
    .input('IDTaller', sql.Int, params.IDTaller)
    .input('IDEmpresa', sql.Int, params.IDEmpresa)
    .query(`
      SELECT IDTaller
      FROM dbo.Taller
      WHERE IDTaller = @IDTaller
        AND IDEmpresa = @IDEmpresa
    `);

  if ((result.recordset || []).length === 0) {
    throw new AppError('Taller no encontrado para la empresa autenticada', 404);
  }
};

const logRepositoryCall = (operationName, params, result) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log({
      operationName,
      params,
      recordsetLength: result.recordset?.length || 0
    });
  }
};

module.exports = {
  obtenerResumen
};
