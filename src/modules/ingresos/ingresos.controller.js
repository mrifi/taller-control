const ingresosService = require('./ingresos.service');

const listar = async (req, res, next) => {
  try {
    const ingresos = await ingresosService.listar(req.user.empresaId, req.query);
    res.json(ingresos);
  } catch (error) {
    next(error);
  }
};

const crear = async (req, res, next) => {
  try {
    const ingreso = await ingresosService.crear(req.user.empresaId, req.body);
    res.status(201).json(ingreso);
  } catch (error) {
    next(error);
  }
};

const actualizar = async (req, res, next) => {
  try {
    const ingreso = await ingresosService.actualizar(req.user.empresaId, req.params, req.body);
    res.json(ingreso);
  } catch (error) {
    next(error);
  }
};

const eliminar = async (req, res, next) => {
  try {
    const result = await ingresosService.eliminar(req.user.empresaId, req.params);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const listarCategorias = async (req, res, next) => {
  try {
    const categorias = await ingresosService.listarCategorias(req.user.empresaId);
    res.json(categorias);
  } catch (error) {
    next(error);
  }
};

const listarTodasCategorias = async (req, res, next) => {
  try {
    const categorias = await ingresosService.listarTodasCategorias(req.user.empresaId);
    res.json(categorias);
  } catch (error) {
    next(error);
  }
};

const crearCategoria = async (req, res, next) => {
  try {
    const categoria = await ingresosService.crearCategoria(req.user.empresaId, req.body);
    res.status(201).json(categoria);
  } catch (error) {
    next(error);
  }
};

const actualizarCategoria = async (req, res, next) => {
  try {
    const categoria = await ingresosService.actualizarCategoria(req.user.empresaId, req.params, req.body);
    res.json(categoria);
  } catch (error) {
    next(error);
  }
};

const desactivarCategoria = async (req, res, next) => {
  try {
    const result = await ingresosService.desactivarCategoria(req.user.empresaId, req.params);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const activarCategoria = async (req, res, next) => {
  try {
    const result = await ingresosService.activarCategoria(req.user.empresaId, req.params);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const marcarComoCobrado = async (req, res, next) => {
  try {
    const result = await ingresosService.marcarComoCobrado(req.user.empresaId, req.params);
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
