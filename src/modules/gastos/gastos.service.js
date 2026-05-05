const gastosRepository = require('./gastos.repository');
const { crearGastoSchema, gastoParamsSchema, listarGastosQuerySchema, tipoGastoParamsSchema, tipoGastoSchema } = require('./gastos.schema');

const listar = async (filters) => {
  const validatedFilters = listarGastosQuerySchema.parse(filters);

  return gastosRepository.listar({
    tallerId: validatedFilters.tallerId ?? null,
    fechaInicio: validatedFilters.fechaInicio ?? null,
    fechaFin: validatedFilters.fechaFin ?? null,
    metodoPago: validatedFilters.metodoPago ?? null,
    tipoGastoId: validatedFilters.tipoGastoId ?? null,
    limit: validatedFilters.limit,
    offset: validatedFilters.offset
  });
};

const crear = async (data) => {
  const validatedData = crearGastoSchema.parse(data);

  return gastosRepository.crear({
    descripcion: validatedData.descripcion,
    fecha: validatedData.fecha,
    monto: validatedData.monto,
    cantidad: validatedData.cantidad,
    metodoPago: validatedData.metodoPago,
    tipoGastoId: validatedData.tipoGastoId,
    tallerId: validatedData.tallerId
  });
};

const actualizar = async (params, data) => {
  const validatedParams = gastoParamsSchema.parse(params);
  const validatedData = crearGastoSchema.parse(data);

  return gastosRepository.actualizar(validatedParams.id, {
    descripcion: validatedData.descripcion,
    fecha: validatedData.fecha,
    monto: validatedData.monto,
    cantidad: validatedData.cantidad,
    metodoPago: validatedData.metodoPago,
    tipoGastoId: validatedData.tipoGastoId,
    tallerId: validatedData.tallerId
  });
};

const eliminar = async (params) => {
  const validatedParams = gastoParamsSchema.parse(params);

  return gastosRepository.eliminar(validatedParams.id);
};

const listarTipos = async () => {
  return gastosRepository.listarTipos();
};

const listarTodosTipos = async () => {
  return gastosRepository.listarTodosTipos();
};

const crearTipo = async (data) => {
  const validatedData = tipoGastoSchema.parse(data);

  return gastosRepository.crearTipo(validatedData.denominacion);
};

const actualizarTipo = async (params, data) => {
  const validatedParams = tipoGastoParamsSchema.parse(params);
  const validatedData = tipoGastoSchema.parse(data);

  return gastosRepository.actualizarTipo(validatedParams.id, validatedData.denominacion);
};

const desactivarTipo = async (params) => {
  const validatedParams = tipoGastoParamsSchema.parse(params);

  return gastosRepository.cambiarEstadoTipo(validatedParams.id, false);
};

const activarTipo = async (params) => {
  const validatedParams = tipoGastoParamsSchema.parse(params);

  return gastosRepository.cambiarEstadoTipo(validatedParams.id, true);
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
