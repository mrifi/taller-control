const talleresRepository = require('./talleres.repository');
const { tallerParamsSchema, tallerSchema } = require('./talleres.schema');

const listar = async () => {
  return talleresRepository.listar();
};

const obtenerComparativa = async () => {
  return talleresRepository.obtenerComparativa();
};

const crear = async (data) => {
  const validatedData = tallerSchema.parse(data);

  return talleresRepository.crear({
    Nombre: validatedData.Nombre,
    Codigo: validatedData.Codigo ?? null
  });
};

const actualizar = async (params, data) => {
  const validatedParams = tallerParamsSchema.parse(params);
  const validatedData = tallerSchema.parse(data);

  return talleresRepository.actualizar(validatedParams.id, {
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
