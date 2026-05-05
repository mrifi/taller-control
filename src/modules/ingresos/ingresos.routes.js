const express = require('express');
const ingresosController = require('./ingresos.controller');

const router = express.Router();

router.get('/', ingresosController.listar);
router.get('/categorias/todas', ingresosController.listarTodasCategorias);
router.get('/categorias', ingresosController.listarCategorias);
router.post('/categorias', ingresosController.crearCategoria);
router.put('/categorias/:id', ingresosController.actualizarCategoria);
router.patch('/categorias/:id/desactivar', ingresosController.desactivarCategoria);
router.patch('/categorias/:id/activar', ingresosController.activarCategoria);
router.post('/', ingresosController.crear);
router.put('/:id', ingresosController.actualizar);
router.delete('/:id', ingresosController.eliminar);
router.patch('/:id/cobrado', ingresosController.marcarComoCobrado);

module.exports = router;
