const { getPool, sql } = require('../../config/db');
const AppError = require('../../utils/AppError');

const listar = async ({ empresaId, tallerId, fechaInicio, fechaFin, metodoPago, estadoPago, limit, offset }) => {
  const pool = await getPool();
  const params = {
    IDEmpresa: empresaId,
    IDTaller: tallerId ?? null,
    FechaInicio: fechaInicio ?? null,
    FechaFin: fechaFin ?? null,
    TipoPago: metodoPago ?? null,
    EstadoPago: estadoPago ?? null,
    Limit: limit ?? 20,
    Offset: offset ?? 0
  };

  const result = await pool.request()
    .input('IDEmpresa', sql.Int, params.IDEmpresa)
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
      WHERE i.IDEmpresa = @IDEmpresa
        AND (@IDTaller IS NULL OR i.IDTaller = @IDTaller)
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
  empresaId,
  descripcion,
  fecha,
  monto,
  cantidad,
  metodoPago,
  categoriaId,
  tallerId,
  estadoPago,
  fechaPagoPrevista,
  fechaPagoReal,
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
    FechaPagoReal: fechaPagoReal ?? (estadoPago === 'CONFIRMADO' ? new Date() : null),
    Cliente: cliente
  };
  params.IDEmpresa = empresaId;

  await ensureIngresoReferencesBelongToEmpresa(pool, params);

  const result = await pool.request()
    .input('IDEmpresa', sql.Int, params.IDEmpresa)
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
        Cliente,
        IDEmpresa
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
        @Cliente,
        @IDEmpresa
      )
    `);

  logRepositoryCall('INSERT dbo.Ingreso', params, result);

  return result.recordset[0] || { message: 'Ingreso creado correctamente' };
};

const actualizar = async (empresaId, id, {
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
    IDIngreso: id,
    IDEmpresa: empresaId,
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

  await ensureIngresoReferencesBelongToEmpresa(pool, params);

  const result = await pool.request()
    .input('IDIngreso', sql.Int, params.IDIngreso)
    .input('IDEmpresa', sql.Int, params.IDEmpresa)
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
      UPDATE dbo.Ingreso
      SET Descripcion = @Descripcion,
          Fecha = @Fecha,
          Monto = @Monto,
          Cantidad = @Cantidad,
          TipoPago = @TipoPago,
          IDTipoIngreso = @IDTipoIngreso,
          IDTaller = @IDTaller,
          EstadoPago = @EstadoPago,
          FechaPagoPrevista = @FechaPagoPrevista,
          FechaPagoReal = @FechaPagoReal,
          Cliente = @Cliente
      OUTPUT INSERTED.*
      WHERE IDIngreso = @IDIngreso
        AND IDEmpresa = @IDEmpresa
    `);

  logRepositoryCall('UPDATE dbo.Ingreso', params, result);

  if (!result.recordset?.[0]) {
    throw new AppError('Ingreso no encontrado', 404);
  }

  return result.recordset[0];
};

const eliminar = async (empresaId, id) => {
  const pool = await getPool();
  const params = { IDIngreso: id, IDEmpresa: empresaId };
  const result = await pool.request()
    .input('IDIngreso', sql.Int, params.IDIngreso)
    .input('IDEmpresa', sql.Int, params.IDEmpresa)
    .query(`
      DELETE FROM dbo.Ingreso
      OUTPUT DELETED.IDIngreso
      WHERE IDIngreso = @IDIngreso
        AND IDEmpresa = @IDEmpresa
    `);

  logRepositoryCall('DELETE dbo.Ingreso', params, result);

  if (!result.recordset?.[0]) {
    throw new AppError('Ingreso no encontrado', 404);
  }

  return { message: 'Ingreso eliminado correctamente', id: result.recordset[0].IDIngreso };
};

const marcarComoCobrado = async (empresaId, id) => {
  const pool = await getPool();
  const params = { IDIngreso: id, IDEmpresa: empresaId };

  const result = await pool.request()
    .input('IDIngreso', sql.Int, params.IDIngreso)
    .input('IDEmpresa', sql.Int, params.IDEmpresa)
    .query(`
      UPDATE dbo.Ingreso
      SET EstadoPago = 'CONFIRMADO',
          FechaPagoReal = CAST(GETDATE() AS DATE)
      OUTPUT INSERTED.*
      WHERE IDIngreso = @IDIngreso
        AND IDEmpresa = @IDEmpresa
    `);

  logRepositoryCall('UPDATE dbo.Ingreso marcar cobrado', params, result);

  if (!result.recordset?.[0]) {
    throw new AppError('Ingreso no encontrado', 404);
  }

  return result.recordset[0];
};

const listarCategorias = async (empresaId) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('IDEmpresa', sql.Int, empresaId)
    .query(`
      SELECT
        IDTipoIngreso,
        Denominacion
      FROM dbo.TipoIngreso
      WHERE Activo = 1
        AND IDEmpresa = @IDEmpresa
      ORDER BY Denominacion
    `);

  logRepositoryCall('SELECT dbo.TipoIngreso', { IDEmpresa: empresaId }, result);

  return result.recordset;
};

const listarTodasCategorias = async (empresaId) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('IDEmpresa', sql.Int, empresaId)
    .query(`
      SELECT
        IDTipoIngreso,
        Denominacion,
        Activo
      FROM dbo.TipoIngreso
      WHERE IDEmpresa = @IDEmpresa
      ORDER BY Activo DESC, Denominacion
    `);

  logRepositoryCall('SELECT dbo.TipoIngreso todas', { IDEmpresa: empresaId }, result);

  return result.recordset || [];
};

const crearCategoria = async (empresaId, denominacion) => {
  const pool = await getPool();
  await ensureCategoriaNotDuplicated(pool, empresaId, denominacion);

  const result = await pool.request()
    .input('IDEmpresa', sql.Int, empresaId)
    .input('Denominacion', sql.VarChar(100), denominacion)
    .query(`
      INSERT INTO dbo.TipoIngreso (Denominacion, Activo, IDEmpresa)
      OUTPUT INSERTED.IDTipoIngreso, INSERTED.Denominacion, INSERTED.Activo
      VALUES (@Denominacion, 1, @IDEmpresa)
    `);

  logRepositoryCall('INSERT dbo.TipoIngreso', { IDEmpresa: empresaId, Denominacion: denominacion }, result);

  return result.recordset[0];
};

const actualizarCategoria = async (empresaId, id, denominacion) => {
  const pool = await getPool();
  await ensureCategoriaExists(pool, empresaId, id);
  await ensureCategoriaNotDuplicated(pool, empresaId, denominacion, id);

  const result = await pool.request()
    .input('IDEmpresa', sql.Int, empresaId)
    .input('IDTipoIngreso', sql.Int, id)
    .input('Denominacion', sql.VarChar(100), denominacion)
    .query(`
      UPDATE dbo.TipoIngreso
      SET Denominacion = @Denominacion
      OUTPUT INSERTED.IDTipoIngreso, INSERTED.Denominacion, INSERTED.Activo
      WHERE IDTipoIngreso = @IDTipoIngreso
        AND IDEmpresa = @IDEmpresa
    `);

  logRepositoryCall('UPDATE dbo.TipoIngreso', { IDEmpresa: empresaId, IDTipoIngreso: id, Denominacion: denominacion }, result);

  return result.recordset[0];
};

const cambiarEstadoCategoria = async (empresaId, id, activo) => {
  const pool = await getPool();
  await ensureCategoriaExists(pool, empresaId, id);

  const result = await pool.request()
    .input('IDEmpresa', sql.Int, empresaId)
    .input('IDTipoIngreso', sql.Int, id)
    .input('Activo', sql.Bit, activo)
    .query(`
      UPDATE dbo.TipoIngreso
      SET Activo = @Activo
      OUTPUT INSERTED.IDTipoIngreso, INSERTED.Denominacion, INSERTED.Activo
      WHERE IDTipoIngreso = @IDTipoIngreso
        AND IDEmpresa = @IDEmpresa
    `);

  logRepositoryCall('UPDATE estado dbo.TipoIngreso', { IDEmpresa: empresaId, IDTipoIngreso: id, Activo: activo }, result);

  return {
    message: activo ? 'Categoria activada correctamente' : 'Categoria desactivada correctamente',
    categoria: result.recordset[0]
  };
};

const ensureCategoriaExists = async (pool, empresaId, id) => {
  const result = await pool.request()
    .input('IDEmpresa', sql.Int, empresaId)
    .input('IDTipoIngreso', sql.Int, id)
    .query(`
      SELECT IDTipoIngreso
      FROM dbo.TipoIngreso
      WHERE IDTipoIngreso = @IDTipoIngreso
        AND IDEmpresa = @IDEmpresa
    `);

  if ((result.recordset || []).length === 0) {
    throw new AppError('Categoria no encontrada', 404);
  }
};

const ensureIngresoReferencesBelongToEmpresa = async (pool, params) => {
  const result = await pool.request()
    .input('IDEmpresa', sql.Int, params.IDEmpresa)
    .input('IDTaller', sql.Int, params.IDTaller)
    .input('IDTipoIngreso', sql.Int, params.IDTipoIngreso)
    .query(`
      SELECT
        (SELECT COUNT(*) FROM dbo.Taller WHERE IDTaller = @IDTaller AND IDEmpresa = @IDEmpresa) AS TallerCount,
        (SELECT COUNT(*) FROM dbo.TipoIngreso WHERE IDTipoIngreso = @IDTipoIngreso AND IDEmpresa = @IDEmpresa) AS CategoriaCount
    `);

  const row = result.recordset?.[0] || {};

  if (Number(row.TallerCount || 0) === 0) {
    throw new AppError('Taller no encontrado para la empresa autenticada', 404);
  }

  if (Number(row.CategoriaCount || 0) === 0) {
    throw new AppError('Categoria no encontrada para la empresa autenticada', 404);
  }
};

const ensureCategoriaNotDuplicated = async (pool, empresaId, denominacion, excludeId = null) => {
  const result = await pool.request()
    .input('IDEmpresa', sql.Int, empresaId)
    .input('Denominacion', sql.VarChar(100), denominacion)
    .input('ExcludeId', sql.Int, excludeId)
    .query(`
      SELECT IDTipoIngreso
      FROM dbo.TipoIngreso
      WHERE UPPER(LTRIM(RTRIM(Denominacion))) = UPPER(LTRIM(RTRIM(@Denominacion)))
        AND IDEmpresa = @IDEmpresa
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
  activarCategoria: (empresaId, id) => cambiarEstadoCategoria(empresaId, id, true),
  actualizar,
  actualizarCategoria,
  cambiarEstadoCategoria,
  crearCategoria,
  desactivarCategoria: (empresaId, id) => cambiarEstadoCategoria(empresaId, id, false),
  eliminar,
  listarCategorias,
  listarTodasCategorias,
  marcarComoCobrado
};
