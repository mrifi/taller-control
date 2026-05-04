const talleresService = require('./talleres.service');

const listar = async (req, res, next) => {
  try {
    const talleres = await talleresService.listar();
    res.json(talleres);
  } catch (error) {
    next(error);
  }
};

const obtenerComparativa = async (req, res, next) => {
  try {
    const comparativa = await talleresService.obtenerComparativa();
    res.json(comparativa);
  } catch (error) {
    next(error);
  }
};

const crear = async (req, res, next) => {
  try {
    const taller = await talleresService.crear(req.body);
    res.status(201).json(taller);
  } catch (error) {
    next(error);
  }
};

const actualizar = async (req, res, next) => {
  try {
    const taller = await talleresService.actualizar(req.params, req.body);
    res.json(taller);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  actualizar,
  crear,
  listar,
  obtenerComparativa
};
