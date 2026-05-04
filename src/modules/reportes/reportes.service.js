const reportesRepository = require('./reportes.repository');
const { resumenReporteQuerySchema } = require('./reportes.schema');

const obtenerResumen = async (filters) => {
  const validatedFilters = resumenReporteQuerySchema.parse(filters);

  return reportesRepository.obtenerResumen({
    tallerId: validatedFilters.tallerId,
    fechaInicio: validatedFilters.fechaInicio,
    fechaFin: validatedFilters.fechaFin
  });
};

module.exports = {
  obtenerResumen
};
