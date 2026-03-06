const express = require('express');
const router = express.Router();
const empresaController = require('../controllers/empresaController');
const { verificarToken, esAdmin } = require('../middlewares/authMiddleware');

// Ambas rutas protegidas con esAdmin
router.get('/', verificarToken, esAdmin, empresaController.obtenerEmpresa);
router.put('/', verificarToken, esAdmin, empresaController.actualizarEmpresa);

module.exports = router;
