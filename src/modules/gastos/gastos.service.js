const gastosRepository = require('./gastos.repository');
const { crearGastoSchema, gastoParamsSchema, listarGastosQuerySchema, tipoGastoParamsSchema, tipoGastoSchema } = require('./gastos.schema');

const listar = async (empresaId, filters) => {
  const validatedFilters = listarGastosQuerySchema.parse(filters);

  return gastosRepository.listar({
    empresaId,
    tallerId: validatedFilters.tallerId ?? null,
    fechaInicio: validatedFilters.fechaInicio ?? null,
    fechaFin: validatedFilters.fechaFin ?? null,
    metodoPago: validatedFilters.metodoPago ?? null,
    tipoGastoId: validatedFilters.tipoGastoId ?? null,
    limit: validatedFilters.limit,
    offset: validatedFilters.offset
  });
};

const crear = async (empresaId, data) => {
  const validatedData = crearGastoSchema.parse(data);

  return gastosRepository.crear({
    empresaId,
    descripcion: validatedData.descripcion,
    fecha: validatedData.fecha,
    monto: validatedData.monto,
    cantidad: validatedData.cantidad,
    metodoPago: validatedData.metodoPago,
    tipoGastoId: validatedData.tipoGastoId,
    tallerId: validatedData.tallerId
  });
};

const actualizar = async (empresaId, params, data) => {
  const validatedParams = gastoParamsSchema.parse(params);
  const validatedData = crearGastoSchema.parse(data);

  return gastosRepository.actualizar(empresaId, validatedParams.id, {
    descripcion: validatedData.descripcion,
    fecha: validatedData.fecha,
    monto: validatedData.monto,
    cantidad: validatedData.cantidad,
    metodoPago: validatedData.metodoPago,
    tipoGastoId: validatedData.tipoGastoId,
    tallerId: validatedData.tallerId
  });
};

const eliminar = async (empresaId, params) => {
  const validatedParams = gastoParamsSchema.parse(params);

  return gastosRepository.eliminar(empresaId, validatedParams.id);
};

const listarTipos = async (empresaId) => {
  return gastosRepository.listarTipos(empresaId);
};

const listarTodosTipos = async (empresaId) => {
  return gastosRepository.listarTodosTipos(empresaId);
};

const crearTipo = async (empresaId, data) => {
  const validatedData = tipoGastoSchema.parse(data);

  return gastosRepository.crearTipo(empresaId, validatedData.denominacion);
};

const actualizarTipo = async (empresaId, params, data) => {
  const validatedParams = tipoGastoParamsSchema.parse(params);
  const validatedData = tipoGastoSchema.parse(data);

  return gastosRepository.actualizarTipo(empresaId, validatedParams.id, validatedData.denominacion);
};

const desactivarTipo = async (empresaId, params) => {
  const validatedParams = tipoGastoParamsSchema.parse(params);

  return gastosRepository.cambiarEstadoTipo(empresaId, validatedParams.id, false);
};

const activarTipo = async (empresaId, params) => {
  const validatedParams = tipoGastoParamsSchema.parse(params);

  return gastosRepository.cambiarEstadoTipo(empresaId, validatedParams.id, true);
};

module.exports = {
  listar,
  crear,
  activarTipo,
  actualizar,
  actualizarTipo,
  crearTipo,
  desactivarTipo,
  eliminar,
  listarTipos,
  listarTodosTipos
};
