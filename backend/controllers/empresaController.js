const pool = require('../config/db');
const bcryptjs = require('bcryptjs');

// OBTENER LOS DATOS ACTUALES
exports.obtenerEmpresa = async (req, res, next) => {
    try {
        const [empresa] = await pool.query(
            'SELECT rfc, nombre FROM empresas WHERE id = ?',
            [req.user.empresa_id]
        );
        res.json(empresa[0]);
    } catch (error) { next(error); }
};

// ACTUALIZAR LOS DATOS
exports.actualizarEmpresa = async (req, res, next) => {
    const { nombre, password } = req.body;
    const empresa_id = req.user.empresa_id;

    try {
        if (password && password.trim() !== '') {
            // Si mandó contraseña, la encriptamos y guardamos todo
            const salt = await bcryptjs.genSalt(10);
            const passHasheada = await bcryptjs.hash(password, salt);

            await pool.query(
                'UPDATE empresas SET nombre = ?, password = ? WHERE id = ?',
                [nombre, passHasheada, empresa_id]
            );
        } else {
            // Si la dejó en blanco, solo actualizamos el nombre
            await pool.query(
                'UPDATE empresas SET nombre = ? WHERE id = ?',
                [nombre, empresa_id]
            );
        }
        res.json({ mensaje: 'Datos de la empresa actualizados con éxito' });
    } catch (error) { next(error); }
};
