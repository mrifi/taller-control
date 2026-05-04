const { getPool, sql } = require('../../config/db');
const AppError = require('../../utils/AppError');

const MAX_TALLERES = 2;
const LIMIT_MESSAGE = 'Has alcanzado el límite de 2 talleres. Contacta para ampliar tu plan.';

const listar = async () => {
  const pool = await getPool();

  const result = await pool.request()
    .query(`
      SELECT
        IDTaller,
        Nombre,
        Codigo
      FROM dbo.Taller
      ORDER BY IDTaller
    `);

  logRepositoryCall('SELECT dbo.Taller', {}, result);

  return result.recordset || [];
};

const obtenerComparativa = async () => {
  const pool = await getPool();
  const result = await pool.request()
    .query(`
      DECLARE @FechaInicio DATE = DATEADD(DAY, -30, CAST(GETDATE() AS DATE));
      DECLARE @FechaFin DATE = CAST(GETDATE() AS DATE);

      WITH ingresosPorTaller AS (
        SELECT
          i.IDTaller,
          COALESCE(SUM(i.Monto), 0) AS ingresosTotales,
          COALESCE(SUM(CASE WHEN i.EstadoPago = 'CONFIRMADO' THEN i.Monto ELSE 0 END), 0) AS cobradoReal,
          COALESCE(SUM(CASE WHEN i.EstadoPago = 'PENDIENTE' THEN i.Monto ELSE 0 END), 0) AS pendienteCobro,
          COALESCE(SUM(i.Cantidad), 0) AS neumaticosVendidos,
          COALESCE(SUM(CASE WHEN i.EstadoPago = 'PENDIENTE' THEN 1 ELSE 0 END), 0) AS ingresosPendientesCount
        FROM dbo.Ingreso i
        WHERE i.Fecha >= @FechaInicio
          AND i.Fecha <= @FechaFin
        GROUP BY i.IDTaller
      ),
      gastosPorTaller AS (
        SELECT
          g.IDTaller,
          COALESCE(SUM(g.Monto), 0) AS gastosTotales
        FROM dbo.Gasto g
        WHERE g.Fecha >= @FechaInicio
          AND g.Fecha <= @FechaFin
        GROUP BY g.IDTaller
      )
      SELECT
        t.IDTaller,
        t.Nombre,
        t.Codigo,
        COALESCE(i.ingresosTotales, 0) AS ingresosTotales,
        COALESCE(g.gastosTotales, 0) AS gastosTotales,
        COALESCE(i.ingresosTotales, 0) - COALESCE(g.gastosTotales, 0) AS saldo,
        COALESCE(i.neumaticosVendidos, 0) AS neumaticosVendidos,
        COALESCE(i.cobradoReal, 0) AS cobradoReal,
        COALESCE(i.pendienteCobro, 0) AS pendienteCobro,
        COALESCE(i.ingresosPendientesCount, 0) AS ingresosPendientesCount
      FROM dbo.Taller t
      LEFT JOIN ingresosPorTaller i ON i.IDTaller = t.IDTaller
      LEFT JOIN gastosPorTaller g ON g.IDTaller = t.IDTaller
      ORDER BY t.IDTaller
    `);

  logRepositoryCall('SELECT comparativa dbo.Taller', {}, result);

  return (result.recordset || []).map((row) => ({
    IDTaller: row.IDTaller,
    Nombre: row.Nombre,
    Codigo: row.Codigo,
    ingresosTotales: toNumber(row.ingresosTotales),
    gastosTotales: toNumber(row.gastosTotales),
    saldo: toNumber(row.saldo),
    neumaticosVendidos: toNumber(row.neumaticosVendidos),
    cobradoReal: toNumber(row.cobradoReal),
    pendienteCobro: toNumber(row.pendienteCobro),
    ingresosPendientesCount: toNumber(row.ingresosPendientesCount)
  }));
};

const crear = async ({ Nombre, Codigo }) => {
  const pool = await getPool();
  const count = await contarTalleres(pool);

  if (count >= MAX_TALLERES) {
    throw new AppError(LIMIT_MESSAGE, 400);
  }

  const params = {
    Nombre,
    Codigo: Codigo ?? null
  };

  const result = await pool.request()
    .input('Nombre', sql.VarChar(150), params.Nombre)
    .input('Codigo', sql.VarChar(50), params.Codigo)
    .query(`
      INSERT INTO dbo.Taller (Nombre, Codigo)
      OUTPUT INSERTED.IDTaller, INSERTED.Nombre, INSERTED.Codigo
      VALUES (@Nombre, @Codigo)
    `);

  logRepositoryCall('INSERT dbo.Taller', params, result);

  return result.recordset[0];
};

const actualizar = async (id, { Nombre, Codigo }) => {
  const pool = await getPool();
  const params = {
    IDTaller: id,
    Nombre,
    Codigo: Codigo ?? null
  };

  const result = await pool.request()
    .input('IDTaller', sql.Int, params.IDTaller)
    .input('Nombre', sql.VarChar(150), params.Nombre)
    .input('Codigo', sql.VarChar(50), params.Codigo)
    .query(`
      UPDATE dbo.Taller
      SET Nombre = @Nombre,
          Codigo = @Codigo
      OUTPUT INSERTED.IDTaller, INSERTED.Nombre, INSERTED.Codigo
      WHERE IDTaller = @IDTaller
    `);

  logRepositoryCall('UPDATE dbo.Taller', params, result);

  if (!result.recordset?.[0]) {
    throw new AppError('Taller no encontrado', 404);
  }

  return result.recordset[0];
};

const contarTalleres = async (pool) => {
  const result = await pool.request()
    .query('SELECT COUNT(*) AS Total FROM dbo.Taller');

  return Number(result.recordset?.[0]?.Total || 0);
};

const toNumber = (value) => {
  const numberValue = Number(value ?? 0);

  return Number.isNaN(numberValue) ? 0 : numberValue;
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
  actualizar,
  crear,
  listar,
  obtenerComparativa
};
