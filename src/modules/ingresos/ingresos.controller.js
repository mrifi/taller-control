const ingresosService = require('./ingresos.service');

const listar = async (req, res, next) => {
  try {
    const ingresos = await ingresosService.listar(req.query);
    res.json(ingresos);
  } catch (error) {
    next(error);
  }
};

const crear = async (req, res, next) => {
  try {
    const ingreso = await ingresosService.crear(req.body);
    res.status(201).json(ingreso);
  } catch (error) {
    next(error);
  }
};

const actualizar = async (req, res, next) => {
  try {
    const ingreso = await ingresosService.actualizar(req.params, req.body);
    res.json(ingreso);
  } catch (error) {
    next(error);
  }
};

const eliminar = async (req, res, next) => {
  try {
    const result = await ingresosService.eliminar(req.params);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const listarCategorias = async (req, res, next) => {
  try {
    const categorias = await ingresosService.listarCategorias();
    res.json(categorias);
  } catch (error) {
    next(error);
  }
};

const listarTodasCategorias = async (req, res, next) => {
  try {
    const categorias = await ingresosService.listarTodasCategorias();
    res.json(categorias);
  } catch (error) {
    next(error);
  }
};

const crearCategoria = async (req, res, next) => {
  try {
    const categoria = await ingresosService.crearCategoria(req.body);
    res.status(201).json(categoria);
  } catch (error) {
    next(error);
  }
};

const actualizarCategoria = async (req, res, next) => {
  try {
    const categoria = await ingresosService.actualizarCategoria(req.params, req.body);
    res.json(categoria);
  } catch (error) {
    next(error);
  }
};

const desactivarCategoria = async (req, res, next) => {
  try {
    const result = await ingresosService.desactivarCategoria(req.params);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const activarCategoria = async (req, res, next) => {
  try {
    const result = await ingresosService.activarCategoria(req.params);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const marcarComoCobrado = async (req, res, next) => {
  try {
    const result = await ingresosService.marcarComoCobrado(req.params);
    res.json(result);
  } catch (error) {
    next(error);
  }
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
