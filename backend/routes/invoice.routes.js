const express = require('express');
const router = express.Router();
const { crearFactura, obtenerFacturas, obtenerFacturaPorId, actualizarFactura, cambiarEstado, eliminarFactura } = require('../controllers/invoiceController');
const { verificarToken, esAdmin } = require('../middlewares/authMiddleware');

// Rutas Generales (Usuarios y Admins)
router.get('/', verificarToken, obtenerFacturas);
router.get('/:id', verificarToken, obtenerFacturaPorId);
router.post('/', verificarToken, crearFactura);
router.patch('/:id/estado', verificarToken, cambiarEstado);

// Rutas Protegidas (SÓLO ADMIN)
router.put('/:id', verificarToken, esAdmin, actualizarFactura);
router.delete('/:id', verificarToken, esAdmin, eliminarFactura);

module.exports = router;