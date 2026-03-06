const express = require('express');
const router = express.Router();
const catalogoController = require('../controllers/catalogoController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.get('/claves', verificarToken, catalogoController.buscarClaves);
router.get('/unidades', verificarToken, catalogoController.buscarUnidades);

module.exports = router;
