const ingresosRepository = require('./ingresos.repository');
const {
  categoriaIngresoSchema,
  categoriaParamsSchema,
  crearIngresoSchema,
  listarIngresosQuerySchema,
  marcarComoCobradoParamsSchema
} = require('./ingresos.schema');

const listar = async (filters) => {
  const validatedFilters = listarIngresosQuerySchema.parse(filters);

  return ingresosRepository.listar({
    tallerId: validatedFilters.tallerId ?? null,
    fechaInicio: validatedFilters.fechaInicio ?? null,
    fechaFin: validatedFilters.fechaFin ?? null,
    metodoPago: validatedFilters.metodoPago ?? null,
    estadoPago: validatedFilters.estadoPago ?? null,
    limit: validatedFilters.limit,
    offset: validatedFilters.offset
  });
};

const crear = async (data) => {
  const validatedData = crearIngresoSchema.parse(data);

  return ingresosRepository.crear({
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

const marcarComoCobrado = async (params) => {
  const validatedParams = marcarComoCobradoParamsSchema.parse(params);

  return ingresosRepository.marcarComoCobrado(validatedParams.id);
};

const listarCategorias = async () => {
  return ingresosRepository.listarCategorias();
};

const listarTodasCategorias = async () => {
  return ingresosRepository.listarTodasCategorias();
};

const crearCategoria = async (data) => {
  const validatedData = categoriaIngresoSchema.parse(data);

  return ingresosRepository.crearCategoria(validatedData.denominacion);
};

const actualizarCategoria = async (params, data) => {
  const validatedParams = categoriaParamsSchema.parse(params);
  const validatedData = categoriaIngresoSchema.parse(data);

  return ingresosRepository.actualizarCategoria(validatedParams.id, validatedData.denominacion);
};

const desactivarCategoria = async (params) => {
  const validatedParams = categoriaParamsSchema.parse(params);

  return ingresosRepository.cambiarEstadoCategoria(validatedParams.id, false);
};

const activarCategoria = async (params) => {
  const validatedParams = categoriaParamsSchema.parse(params);

  return ingresosRepository.cambiarEstadoCategoria(validatedParams.id, true);
};

module.exports = {
  listar,
  crear,
  activarCategoria,
  actualizarCategoria,
  crearCategoria,
  desactivarCategoria,
  listarCategorias,
  listarTodasCategorias,
  marcarComoCobrado
};
