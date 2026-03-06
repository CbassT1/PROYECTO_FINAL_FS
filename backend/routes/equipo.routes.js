const express = require('express');
const router = express.Router();
const equipoController = require('../controllers/equipoController');
const { verificarToken, esAdmin } = require('../middlewares/authMiddleware');

// Lectura general (Todos pueden ver)
router.get('/', verificarToken, equipoController.obtenerEquipo);
router.get('/:id/facturas', verificarToken, equipoController.obtenerFacturasUsuario);

// Modificación (Sólo Admin)
router.put('/:id', verificarToken, esAdmin, equipoController.actualizarUsuario);
router.delete('/:id', verificarToken, esAdmin, equipoController.eliminarUsuario);

module.exports = router;