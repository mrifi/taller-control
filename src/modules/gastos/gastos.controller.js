const gastosService = require('./gastos.service');

const listar = async (req, res, next) => {
  try {
    const gastos = await gastosService.listar(req.query);
    res.json(gastos);
  } catch (error) {
    next(error);
  }
};

const crear = async (req, res, next) => {
  try {
    const gasto = await gastosService.crear(req.body);
    res.status(201).json(gasto);
  } catch (error) {
    next(error);
  }
};

const actualizar = async (req, res, next) => {
  try {
    const gasto = await gastosService.actualizar(req.params, req.body);
    res.json(gasto);
  } catch (error) {
    next(error);
  }
};

const eliminar = async (req, res, next) => {
  try {
    const result = await gastosService.eliminar(req.params);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const listarTipos = async (req, res, next) => {
  try {
    const tipos = await gastosService.listarTipos();
    res.json(tipos);
  } catch (error) {
    next(error);
  }
};

const listarTodosTipos = async (req, res, next) => {
  try {
    const tipos = await gastosService.listarTodosTipos();
    res.json(tipos);
  } catch (error) {
    next(error);
  }
};

const crearTipo = async (req, res, next) => {
  try {
    const tipo = await gastosService.crearTipo(req.body);
    res.status(201).json(tipo);
  } catch (error) {
    next(error);
  }
};

const actualizarTipo = async (req, res, next) => {
  try {
    const tipo = await gastosService.actualizarTipo(req.params, req.body);
    res.json(tipo);
  } catch (error) {
    next(error);
  }
};

const desactivarTipo = async (req, res, next) => {
  try {
    const result = await gastosService.desactivarTipo(req.params);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const activarTipo = async (req, res, next) => {
  try {
    const result = await gastosService.activarTipo(req.params);
    res.json(result);
  } catch (error) {
    next(error);
  }
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
