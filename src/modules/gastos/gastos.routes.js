const express = require('express');
const gastosController = require('./gastos.controller');

const router = express.Router();

router.get('/tipos/todos', gastosController.listarTodosTipos);
router.get('/tipos', gastosController.listarTipos);
router.post('/tipos', gastosController.crearTipo);
router.put('/tipos/:id', gastosController.actualizarTipo);
router.patch('/tipos/:id/desactivar', gastosController.desactivarTipo);
router.patch('/tipos/:id/activar', gastosController.activarTipo);
router.get('/', gastosController.listar);
router.post('/', gastosController.crear);

module.exports = router;
