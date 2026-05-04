const express = require('express');
const reportesController = require('./reportes.controller');

const router = express.Router();

router.get('/resumen', reportesController.obtenerResumen);

module.exports = router;
