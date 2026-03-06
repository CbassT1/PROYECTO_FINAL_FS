const pool = require('../config/db');

exports.buscarClaves = async (req, res, next) => {
    const { q } = req.query; // Lo que el usuario escribe en el input
    if (!q) return res.json([]);

    try {
        const termino = `%${q}%`;
        // Buscamos tanto por el número de clave como por la descripción (Límite 20 para no saturar)
        const [rows] = await pool.query(
            'SELECT clave, descripcion FROM catalogo_claves WHERE clave LIKE ? OR descripcion LIKE ? LIMIT 20',
            [termino, termino]
        );
        res.json(rows);
    } catch (error) { next(error); }
};

exports.buscarUnidades = async (req, res, next) => {
    const { q } = req.query;
    if (!q) return res.json([]);

    try {
        const termino = `%${q}%`;
        const [rows] = await pool.query(
            'SELECT clave, nombre FROM catalogo_unidades WHERE clave LIKE ? OR nombre LIKE ? LIMIT 20',
            [termino, termino]
        );
        res.json(rows);
    } catch (error) { next(error); }
};
