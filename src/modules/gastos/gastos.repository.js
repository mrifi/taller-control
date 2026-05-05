const { getPool, sql } = require('../../config/db');
const AppError = require('../../utils/AppError');

const listar = async ({ tallerId, fechaInicio, fechaFin, metodoPago, tipoGastoId, limit, offset }) => {
  const pool = await getPool();
  const params = {
    IDTaller: tallerId ?? null,
    FechaInicio: fechaInicio ?? null,
    FechaFin: fechaFin ?? null,
    TipoPago: metodoPago ?? null,
    IDTipoGasto: tipoGastoId ?? null,
    Limit: limit ?? 20,
    Offset: offset ?? 0
  };

  const result = await pool.request()
    .input('IDTaller', sql.Int, params.IDTaller)
    .input('FechaInicio', sql.Date, params.FechaInicio)
    .input('FechaFin', sql.Date, params.FechaFin)
    .input('TipoPago', sql.VarChar(50), params.TipoPago)
    .input('IDTipoGasto', sql.Int, params.IDTipoGasto)
    .input('Limit', sql.Int, params.Limit)
    .input('Offset', sql.Int, params.Offset)
    .query(`
      SELECT
        g.IDGasto,
        g.Descripcion,
        g.Fecha,
        g.Monto,
        g.Cantidad,
        g.TipoPago,
        g.IDTipoGasto,
        tg.Denominacion AS TipoGasto,
        g.IDTaller,
        t.Nombre AS Taller
      FROM dbo.Gasto g
      LEFT JOIN dbo.TipoGasto tg ON tg.IDTipoGasto = g.IDTipoGasto
      LEFT JOIN dbo.Taller t ON t.IDTaller = g.IDTaller
      WHERE (@IDTaller IS NULL OR g.IDTaller = @IDTaller)
        AND (@FechaInicio IS NULL OR g.Fecha >= @FechaInicio)
        AND (@FechaFin IS NULL OR g.Fecha <= @FechaFin)
        AND (@TipoPago IS NULL OR g.TipoPago = @TipoPago)
        AND (@IDTipoGasto IS NULL OR g.IDTipoGasto = @IDTipoGasto)
      ORDER BY g.Fecha DESC, g.IDGasto DESC
      OFFSET @Offset ROWS
      FETCH NEXT (@Limit + 1) ROWS ONLY
    `);

  logRepositoryCall('SELECT dbo.Gasto', params, result);

  const rows = result.recordset || [];

  return {
    items: rows.slice(0, params.Limit),
    hasMore: rows.length > params.Limit,
    nextOffset: params.Offset + Math.min(rows.length, params.Limit),
    limit: params.Limit
  };
};

const crear = async ({ descripcion, fecha, monto, cantidad, metodoPago, tipoGastoId, tallerId }) => {
  const pool = await getPool();
  const params = {
    Descripcion: descripcion,
    Fecha: fecha,
    Monto: monto,
    Cantidad: cantidad,
    TipoPago: metodoPago,
    IDTipoGasto: tipoGastoId,
    IDTaller: tallerId
  };

  const result = await pool.request()
    .input('Descripcion', sql.VarChar(255), params.Descripcion)
    .input('Fecha', sql.Date, params.Fecha)
    .input('Monto', sql.Decimal(18, 2), params.Monto)
    .input('Cantidad', sql.Int, params.Cantidad)
    .input('TipoPago', sql.VarChar(50), params.TipoPago)
    .input('IDTipoGasto', sql.Int, params.IDTipoGasto)
    .input('IDTaller', sql.Int, params.IDTaller)
    .query(`
      INSERT INTO dbo.Gasto (
        Descripcion,
        Fecha,
        Monto,
        Cantidad,
        TipoPago,
        IDTipoGasto,
        IDTaller
      )
      OUTPUT INSERTED.*
      VALUES (
        @Descripcion,
        @Fecha,
        @Monto,
        @Cantidad,
        @TipoPago,
        @IDTipoGasto,
        @IDTaller
      )
    `);

  logRepositoryCall('INSERT dbo.Gasto', params, result);

  return result.recordset[0] || { message: 'Gasto creado correctamente' };
};

const actualizar = async (id, { descripcion, fecha, monto, cantidad, metodoPago, tipoGastoId, tallerId }) => {
  const pool = await getPool();
  const params = {
    IDGasto: id,
    Descripcion: descripcion,
    Fecha: fecha,
    Monto: monto,
    Cantidad: cantidad,
    TipoPago: metodoPago,
    IDTipoGasto: tipoGastoId,
    IDTaller: tallerId
  };

  const result = await pool.request()
    .input('IDGasto', sql.Int, params.IDGasto)
    .input('Descripcion', sql.VarChar(255), params.Descripcion)
    .input('Fecha', sql.Date, params.Fecha)
    .input('Monto', sql.Decimal(18, 2), params.Monto)
    .input('Cantidad', sql.Int, params.Cantidad)
    .input('TipoPago', sql.VarChar(50), params.TipoPago)
    .input('IDTipoGasto', sql.Int, params.IDTipoGasto)
    .input('IDTaller', sql.Int, params.IDTaller)
    .query(`
      UPDATE dbo.Gasto
      SET Descripcion = @Descripcion,
          Fecha = @Fecha,
          Monto = @Monto,
          Cantidad = @Cantidad,
          TipoPago = @TipoPago,
          IDTipoGasto = @IDTipoGasto,
          IDTaller = @IDTaller
      OUTPUT INSERTED.*
      WHERE IDGasto = @IDGasto
    `);

  logRepositoryCall('UPDATE dbo.Gasto', params, result);

  if (!result.recordset?.[0]) {
    throw new AppError('Gasto no encontrado', 404);
  }

  return result.recordset[0];
};

const eliminar = async (id) => {
  const pool = await getPool();
  const params = { IDGasto: id };
  const result = await pool.request()
    .input('IDGasto', sql.Int, params.IDGasto)
    .query(`
      DELETE FROM dbo.Gasto
      OUTPUT DELETED.IDGasto
      WHERE IDGasto = @IDGasto
    `);

  logRepositoryCall('DELETE dbo.Gasto', params, result);

  if (!result.recordset?.[0]) {
    throw new AppError('Gasto no encontrado', 404);
  }

  return { message: 'Gasto eliminado correctamente', id: result.recordset[0].IDGasto };
};

const listarTipos = async () => {
  const pool = await getPool();
  const result = await pool.request()
    .query(`
      SELECT
        IDTipoGasto,
        Denominacion
      FROM dbo.TipoGasto
      WHERE Activo = 1
      ORDER BY Denominacion
    `);

  logRepositoryCall('SELECT dbo.TipoGasto', {}, result);

  return result.recordset || [];
};

const listarTodosTipos = async () => {
  const pool = await getPool();
  const result = await pool.request()
    .query(`
      SELECT
        IDTipoGasto,
        Denominacion,
        Activo
      FROM dbo.TipoGasto
      ORDER BY Activo DESC, Denominacion
    `);

  logRepositoryCall('SELECT dbo.TipoGasto todos', {}, result);

  return result.recordset || [];
};

const crearTipo = async (denominacion) => {
  const pool = await getPool();
  await ensureTipoNotDuplicated(pool, denominacion);

  const result = await pool.request()
    .input('Denominacion', sql.VarChar(100), denominacion)
    .query(`
      INSERT INTO dbo.TipoGasto (Denominacion, Activo)
      OUTPUT INSERTED.IDTipoGasto, INSERTED.Denominacion, INSERTED.Activo
      VALUES (@Denominacion, 1)
    `);

  logRepositoryCall('INSERT dbo.TipoGasto', { Denominacion: denominacion }, result);

  return result.recordset[0];
};

const actualizarTipo = async (id, denominacion) => {
  const pool = await getPool();
  await ensureTipoExists(pool, id);
  await ensureTipoNotDuplicated(pool, denominacion, id);

  const result = await pool.request()
    .input('IDTipoGasto', sql.Int, id)
    .input('Denominacion', sql.VarChar(100), denominacion)
    .query(`
      UPDATE dbo.TipoGasto
      SET Denominacion = @Denominacion
      OUTPUT INSERTED.IDTipoGasto, INSERTED.Denominacion, INSERTED.Activo
      WHERE IDTipoGasto = @IDTipoGasto
    `);

  logRepositoryCall('UPDATE dbo.TipoGasto', { IDTipoGasto: id, Denominacion: denominacion }, result);

  return result.recordset[0];
};

const cambiarEstadoTipo = async (id, activo) => {
  const pool = await getPool();
  await ensureTipoExists(pool, id);

  const result = await pool.request()
    .input('IDTipoGasto', sql.Int, id)
    .input('Activo', sql.Bit, activo)
    .query(`
      UPDATE dbo.TipoGasto
      SET Activo = @Activo
      OUTPUT INSERTED.IDTipoGasto, INSERTED.Denominacion, INSERTED.Activo
      WHERE IDTipoGasto = @IDTipoGasto
    `);

  logRepositoryCall('UPDATE estado dbo.TipoGasto', { IDTipoGasto: id, Activo: activo }, result);

  return {
    message: activo ? 'Tipo de gasto activado correctamente' : 'Tipo de gasto desactivado correctamente',
    tipo: result.recordset[0]
  };
};

const ensureTipoExists = async (pool, id) => {
  const result = await pool.request()
    .input('IDTipoGasto', sql.Int, id)
    .query(`
      SELECT IDTipoGasto
      FROM dbo.TipoGasto
      WHERE IDTipoGasto = @IDTipoGasto
    `);

  if ((result.recordset || []).length === 0) {
    throw new AppError('Tipo de gasto no encontrado', 404);
  }
};

const ensureTipoNotDuplicated = async (pool, denominacion, excludeId = null) => {
  const result = await pool.request()
    .input('Denominacion', sql.VarChar(100), denominacion)
    .input('ExcludeId', sql.Int, excludeId)
    .query(`
      SELECT IDTipoGasto
      FROM dbo.TipoGasto
      WHERE UPPER(LTRIM(RTRIM(Denominacion))) = UPPER(LTRIM(RTRIM(@Denominacion)))
        AND (@ExcludeId IS NULL OR IDTipoGasto <> @ExcludeId)
    `);

  if ((result.recordset || []).length > 0) {
    throw new AppError('Ya existe un tipo de gasto con esa denominacion', 409);
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
  listar,
  crear,
  actualizar,
  actualizarTipo,
  cambiarEstadoTipo,
  crearTipo,
  eliminar,
  listarTipos,
  listarTodosTipos
};
