const { getPool, sql } = require('../../config/db');
const AppError = require('../../utils/AppError');

const listar = async ({ tallerId, fechaInicio, fechaFin, metodoPago, estadoPago, limit, offset }) => {
  const pool = await getPool();
  const params = {
    IDTaller: tallerId ?? null,
    FechaInicio: fechaInicio ?? null,
    FechaFin: fechaFin ?? null,
    TipoPago: metodoPago ?? null,
    EstadoPago: estadoPago ?? null,
    Limit: limit ?? 20,
    Offset: offset ?? 0
  };

  const result = await pool.request()
    .input('IDTaller', sql.Int, params.IDTaller)
    .input('FechaInicio', sql.Date, params.FechaInicio)
    .input('FechaFin', sql.Date, params.FechaFin)
    .input('TipoPago', sql.VarChar(50), params.TipoPago)
    .input('EstadoPago', sql.VarChar(20), params.EstadoPago)
    .input('Limit', sql.Int, params.Limit)
    .input('Offset', sql.Int, params.Offset)
    .query(`
      SELECT
        i.IDIngreso,
        i.Descripcion,
        i.Fecha,
        i.Monto,
        i.Cantidad,
        i.TipoPago,
        i.IDTipoIngreso,
        ti.Denominacion AS TipoIngreso,
        i.IDTaller,
        t.Nombre AS Taller,
        i.EstadoPago,
        i.FechaPagoPrevista,
        i.FechaPagoReal,
        i.Cliente
      FROM dbo.Ingreso i
      LEFT JOIN dbo.TipoIngreso ti ON ti.IDTipoIngreso = i.IDTipoIngreso
      LEFT JOIN dbo.Taller t ON t.IDTaller = i.IDTaller
      WHERE (@IDTaller IS NULL OR i.IDTaller = @IDTaller)
        AND (@FechaInicio IS NULL OR i.Fecha >= @FechaInicio)
        AND (@FechaFin IS NULL OR i.Fecha <= @FechaFin)
        AND (@TipoPago IS NULL OR i.TipoPago = @TipoPago)
        AND (@EstadoPago IS NULL OR i.EstadoPago = @EstadoPago)
      ORDER BY i.Fecha DESC, i.IDIngreso DESC
      OFFSET @Offset ROWS
      FETCH NEXT (@Limit + 1) ROWS ONLY
    `);

  logRepositoryCall('SELECT dbo.Ingreso', params, result);

  const rows = result.recordset || [];

  return {
    items: rows.slice(0, params.Limit),
    hasMore: rows.length > params.Limit,
    nextOffset: params.Offset + Math.min(rows.length, params.Limit),
    limit: params.Limit
  };
};

const crear = async ({
  descripcion,
  fecha,
  monto,
  cantidad,
  metodoPago,
  categoriaId,
  tallerId,
  estadoPago,
  fechaPagoPrevista,
  cliente
}) => {
  const pool = await getPool();
  const params = {
    Descripcion: descripcion,
    Fecha: fecha,
    Monto: monto,
    Cantidad: cantidad,
    TipoPago: metodoPago,
    IDTipoIngreso: categoriaId,
    IDTaller: tallerId,
    EstadoPago: estadoPago,
    FechaPagoPrevista: fechaPagoPrevista,
    FechaPagoReal: estadoPago === 'CONFIRMADO' ? new Date() : null,
    Cliente: cliente
  };

  const result = await pool.request()
    .input('Descripcion', sql.VarChar(255), params.Descripcion)
    .input('Fecha', sql.Date, params.Fecha)
    .input('Monto', sql.Decimal(18, 2), params.Monto)
    .input('Cantidad', sql.Int, params.Cantidad)
    .input('TipoPago', sql.VarChar(50), params.TipoPago)
    .input('IDTipoIngreso', sql.Int, params.IDTipoIngreso)
    .input('IDTaller', sql.Int, params.IDTaller)
    .input('EstadoPago', sql.VarChar(20), params.EstadoPago)
    .input('FechaPagoPrevista', sql.Date, params.FechaPagoPrevista)
    .input('FechaPagoReal', sql.Date, params.FechaPagoReal)
    .input('Cliente', sql.VarChar(150), params.Cliente)
    .query(`
      INSERT INTO dbo.Ingreso (
        Descripcion,
        Fecha,
        Monto,
        Cantidad,
        TipoPago,
        IDTipoIngreso,
        IDTaller,
        EstadoPago,
        FechaPagoPrevista,
        FechaPagoReal,
        Cliente
      )
      OUTPUT INSERTED.*
      VALUES (
        @Descripcion,
        @Fecha,
        @Monto,
        @Cantidad,
        @TipoPago,
        @IDTipoIngreso,
        @IDTaller,
        @EstadoPago,
        @FechaPagoPrevista,
        @FechaPagoReal,
        @Cliente
      )
    `);

  logRepositoryCall('INSERT dbo.Ingreso', params, result);

  return result.recordset[0] || { message: 'Ingreso creado correctamente' };
};

const marcarComoCobrado = async (id) => {
  const pool = await getPool();
  const procedureName = 'dbo.Ingreso_Marcar_Como_Cobrado';
  const params = { IDIngreso: id };

  const result = await pool.request()
    .input('IDIngreso', sql.Int, params.IDIngreso)
    .execute(procedureName);

  logRepositoryCall(procedureName, params, result);

  return result.recordset?.[0] || { message: 'Ingreso marcado como cobrado correctamente' };
};

const listarCategorias = async () => {
  const pool = await getPool();
  const result = await pool.request()
    .query(`
      SELECT
        IDTipoIngreso,
        Denominacion
      FROM dbo.TipoIngreso
      WHERE Activo = 1
      ORDER BY Denominacion
    `);

  logRepositoryCall('SELECT dbo.TipoIngreso', {}, result);

  return result.recordset;
};

const listarTodasCategorias = async () => {
  const pool = await getPool();
  const result = await pool.request()
    .query(`
      SELECT
        IDTipoIngreso,
        Denominacion,
        Activo
      FROM dbo.TipoIngreso
      ORDER BY Activo DESC, Denominacion
    `);

  logRepositoryCall('SELECT dbo.TipoIngreso todas', {}, result);

  return result.recordset || [];
};

const crearCategoria = async (denominacion) => {
  const pool = await getPool();
  await ensureCategoriaNotDuplicated(pool, denominacion);

  const result = await pool.request()
    .input('Denominacion', sql.VarChar(100), denominacion)
    .query(`
      INSERT INTO dbo.TipoIngreso (Denominacion, Activo)
      OUTPUT INSERTED.IDTipoIngreso, INSERTED.Denominacion, INSERTED.Activo
      VALUES (@Denominacion, 1)
    `);

  logRepositoryCall('INSERT dbo.TipoIngreso', { Denominacion: denominacion }, result);

  return result.recordset[0];
};

const actualizarCategoria = async (id, denominacion) => {
  const pool = await getPool();
  await ensureCategoriaExists(pool, id);
  await ensureCategoriaNotDuplicated(pool, denominacion, id);

  const result = await pool.request()
    .input('IDTipoIngreso', sql.Int, id)
    .input('Denominacion', sql.VarChar(100), denominacion)
    .query(`
      UPDATE dbo.TipoIngreso
      SET Denominacion = @Denominacion
      OUTPUT INSERTED.IDTipoIngreso, INSERTED.Denominacion, INSERTED.Activo
      WHERE IDTipoIngreso = @IDTipoIngreso
    `);

  logRepositoryCall('UPDATE dbo.TipoIngreso', { IDTipoIngreso: id, Denominacion: denominacion }, result);

  return result.recordset[0];
};

const cambiarEstadoCategoria = async (id, activo) => {
  const pool = await getPool();
  await ensureCategoriaExists(pool, id);

  const result = await pool.request()
    .input('IDTipoIngreso', sql.Int, id)
    .input('Activo', sql.Bit, activo)
    .query(`
      UPDATE dbo.TipoIngreso
      SET Activo = @Activo
      OUTPUT INSERTED.IDTipoIngreso, INSERTED.Denominacion, INSERTED.Activo
      WHERE IDTipoIngreso = @IDTipoIngreso
    `);

  logRepositoryCall('UPDATE estado dbo.TipoIngreso', { IDTipoIngreso: id, Activo: activo }, result);

  return {
    message: activo ? 'Categoria activada correctamente' : 'Categoria desactivada correctamente',
    categoria: result.recordset[0]
  };
};

const ensureCategoriaExists = async (pool, id) => {
  const result = await pool.request()
    .input('IDTipoIngreso', sql.Int, id)
    .query(`
      SELECT IDTipoIngreso
      FROM dbo.TipoIngreso
      WHERE IDTipoIngreso = @IDTipoIngreso
    `);

  if ((result.recordset || []).length === 0) {
    throw new AppError('Categoria no encontrada', 404);
  }
};

const ensureCategoriaNotDuplicated = async (pool, denominacion, excludeId = null) => {
  const result = await pool.request()
    .input('Denominacion', sql.VarChar(100), denominacion)
    .input('ExcludeId', sql.Int, excludeId)
    .query(`
      SELECT IDTipoIngreso
      FROM dbo.TipoIngreso
      WHERE UPPER(LTRIM(RTRIM(Denominacion))) = UPPER(LTRIM(RTRIM(@Denominacion)))
        AND (@ExcludeId IS NULL OR IDTipoIngreso <> @ExcludeId)
    `);

  if ((result.recordset || []).length > 0) {
    throw new AppError('Ya existe una categoria con esa denominacion', 409);
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
  activarCategoria: (id) => cambiarEstadoCategoria(id, true),
  actualizarCategoria,
  cambiarEstadoCategoria,
  crearCategoria,
  desactivarCategoria: (id) => cambiarEstadoCategoria(id, false),
  listarCategorias,
  listarTodasCategorias,
  marcarComoCobrado
};
