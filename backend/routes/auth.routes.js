const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verificarToken } = require('../middlewares/authMiddleware');

// === RUTA DE PRUEBA (Para ver si el archivo se está leyendo) ===
router.get('/ping', (req, res) => res.json({ mensaje: 'Las rutas de auth están vivas' }));

// 1. Ruta para registrar la Empresa
router.post('/empresa/register', authController.registrarEmpresa);

// 2. Rutas para el Usuario
router.post('/register', verificarToken, authController.registrarUsuario);
router.post('/login', authController.loginUsuario);

module.exports = router;