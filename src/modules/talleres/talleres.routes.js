const express = require('express');
const talleresController = require('./talleres.controller');

const router = express.Router();

router.get('/comparativa', talleresController.obtenerComparativa);
router.get('/', talleresController.listar);
router.post('/', talleresController.crear);
router.put('/:id', talleresController.actualizar);

module.exports = router;
