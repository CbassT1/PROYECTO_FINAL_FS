const express = require('express');
const router = express.Router();

// Importaciones
const { obtenerFacturas, obtenerFacturaPorId, actualizarFactura, cambiarEstado, eliminarFactura, agregarPago } = require('../controllers/invoiceController');
const facturasController = require('../controllers/facturasController');
const { verificarToken, esAdmin } = require('../middlewares/authMiddleware');

// --- Rutas de Clientes ---
router.post('/clientes', verificarToken, facturasController.crearCliente);
router.get('/clientes/buscar', verificarToken, facturasController.buscarClientes);

// --- Rutas de Facturas Generales ---
router.get('/', verificarToken, obtenerFacturas);
router.get('/:id', verificarToken, obtenerFacturaPorId);
router.post('/', verificarToken, facturasController.crearFactura);
router.patch('/:id/estado', verificarToken, cambiarEstado);

// --- Rutas de Pagos (Complementos) ---
router.post('/:id/pagos', verificarToken, agregarPago);

// --- Rutas Protegidas (SÓLO ADMIN) ---
router.put('/:id', verificarToken, esAdmin, actualizarFactura);
router.delete('/:id', verificarToken, esAdmin, eliminarFactura);

module.exports = router;
