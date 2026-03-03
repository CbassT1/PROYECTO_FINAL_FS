require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db'); // Importamos la conexión para probarla

const app = express();
app.use(cors());
app.use(express.json());

// Importar rutas
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/facturas', require('./routes/invoice.routes'));

// Middleware GLOBAL de errores
app.use((err, req, res, next) => {
    console.error("🔥 Error del servidor:", err.message);
    res.status(500).json({ mensaje: 'Ocurrió un error interno', detalle: err.message });
});

const PORT = process.env.PORT || 3000;

// SOLO arranca el servidor si NO estamos haciendo pruebas
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, async () => {
        console.log(`\n🚀 Servidor backend encendido en el puerto ${PORT}`);
        try {
            const connection = await pool.getConnection();
            console.log('✅ Conexión a MySQL exitosa!');
            connection.release();
        } catch (error) {
            console.error('❌ Error de conexión:', error.message);
        }
    });
}

module.exports = app;