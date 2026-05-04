const dashboardService = require('./dashboard.service');

const getResumen = async (req, res, next) => {
  try {
    const resumen = await dashboardService.getResumen(req.query);
    res.json(resumen);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getResumen
};
