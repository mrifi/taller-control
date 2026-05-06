const talleresRepository = require('./talleres.repository');
const { tallerParamsSchema, tallerSchema } = require('./talleres.schema');

const listar = async (empresaId) => {
  return talleresRepository.listar(empresaId);
};

const obtenerComparativa = async (empresaId) => {
  return talleresRepository.obtenerComparativa(empresaId);
};

const crear = async (empresaId, data) => {
  const validatedData = tallerSchema.parse(data);

  return talleresRepository.crear(empresaId, {
    Nombre: validatedData.Nombre,
    Codigo: validatedData.Codigo ?? null
  });
};

const actualizar = async (empresaId, params, data) => {
  const validatedParams = tallerParamsSchema.parse(params);
  const validatedData = tallerSchema.parse(data);

  return talleresRepository.actualizar(empresaId, validatedParams.id, {
    Nombre: validatedData.Nombre,
    Codigo: validatedData.Codigo ?? null
  });
};

module.exports = {
  actualizar,
  crear,
  listar,
  obtenerComparativa
};
