const ingresosRepository = require('./ingresos.repository');
const {
  categoriaIngresoSchema,
  categoriaParamsSchema,
  crearIngresoSchema,
  ingresoParamsSchema,
  listarIngresosQuerySchema,
  marcarComoCobradoParamsSchema
} = require('./ingresos.schema');

const listar = async (empresaId, filters) => {
  const validatedFilters = listarIngresosQuerySchema.parse(filters);

  return ingresosRepository.listar({
    empresaId,
    tallerId: validatedFilters.tallerId ?? null,
    fechaInicio: validatedFilters.fechaInicio ?? null,
    fechaFin: validatedFilters.fechaFin ?? null,
    metodoPago: validatedFilters.metodoPago ?? null,
    estadoPago: validatedFilters.estadoPago ?? null,
    limit: validatedFilters.limit,
    offset: validatedFilters.offset
  });
};

const crear = async (empresaId, data) => {
  const validatedData = crearIngresoSchema.parse(data);

  return ingresosRepository.crear({
    empresaId,
    descripcion: validatedData.descripcion,
    fecha: validatedData.fecha,
    monto: validatedData.monto,
    cantidad: validatedData.cantidad,
    metodoPago: validatedData.metodoPago,
    categoriaId: validatedData.categoriaId,
    tallerId: validatedData.tallerId,
    estadoPago: validatedData.estadoPago,
    fechaPagoPrevista: validatedData.fechaPagoPrevista ?? null,
    fechaPagoReal: validatedData.fechaPagoReal,
    cliente: validatedData.cliente ?? null
  });
};

const actualizar = async (empresaId, params, data) => {
  const validatedParams = ingresoParamsSchema.parse(params);
  const validatedData = crearIngresoSchema.parse(data);

  return ingresosRepository.actualizar(empresaId, validatedParams.id, {
    descripcion: validatedData.descripcion,
    fecha: validatedData.fecha,
    monto: validatedData.monto,
    cantidad: validatedData.cantidad,
    metodoPago: validatedData.metodoPago,
    categoriaId: validatedData.categoriaId,
    tallerId: validatedData.tallerId,
    estadoPago: validatedData.estadoPago,
    fechaPagoPrevista: validatedData.fechaPagoPrevista ?? null,
    cliente: validatedData.cliente ?? null
  });
};

const eliminar = async (empresaId, params) => {
  const validatedParams = ingresoParamsSchema.parse(params);

  return ingresosRepository.eliminar(empresaId, validatedParams.id);
};

const marcarComoCobrado = async (empresaId, params) => {
  const validatedParams = marcarComoCobradoParamsSchema.parse(params);

  return ingresosRepository.marcarComoCobrado(empresaId, validatedParams.id);
};

const listarCategorias = async (empresaId) => {
  return ingresosRepository.listarCategorias(empresaId);
};

const listarTodasCategorias = async (empresaId) => {
  return ingresosRepository.listarTodasCategorias(empresaId);
};

const crearCategoria = async (empresaId, data) => {
  const validatedData = categoriaIngresoSchema.parse(data);

  return ingresosRepository.crearCategoria(empresaId, validatedData.denominacion);
};

const actualizarCategoria = async (empresaId, params, data) => {
  const validatedParams = categoriaParamsSchema.parse(params);
  const validatedData = categoriaIngresoSchema.parse(data);

  return ingresosRepository.actualizarCategoria(empresaId, validatedParams.id, validatedData.denominacion);
};

const desactivarCategoria = async (empresaId, params) => {
  const validatedParams = categoriaParamsSchema.parse(params);

  return ingresosRepository.cambiarEstadoCategoria(empresaId, validatedParams.id, false);
};

const activarCategoria = async (empresaId, params) => {
  const validatedParams = categoriaParamsSchema.parse(params);

  return ingresosRepository.cambiarEstadoCategoria(empresaId, validatedParams.id, true);
};

module.exports = {
  listar,
  crear,
  activarCategoria,
  actualizar,
  actualizarCategoria,
  crearCategoria,
  desactivarCategoria,
  eliminar,
  listarCategorias,
  listarTodasCategorias,
  marcarComoCobrado
};
