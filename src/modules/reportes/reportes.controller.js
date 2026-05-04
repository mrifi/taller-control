const reportesService = require('./reportes.service');

const obtenerResumen = async (req, res, next) => {
  try {
    const reporte = await reportesService.obtenerResumen(req.query);
    res.json(reporte);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerResumen
};
