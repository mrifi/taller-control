const reportesRepository = require('./reportes.repository');
const { resumenReporteQuerySchema } = require('./reportes.schema');

const obtenerResumen = async (empresaId, filters) => {
  const validatedFilters = resumenReporteQuerySchema.parse(filters);

  return reportesRepository.obtenerResumen({
    empresaId,
    tallerId: validatedFilters.tallerId,
    fechaInicio: validatedFilters.fechaInicio,
    fechaFin: validatedFilters.fechaFin
  });
};

module.exports = {
  obtenerResumen
};
