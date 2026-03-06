const pool = require('../config/db');

exports.obtenerEquipo = async (req, res, next) => {
    try {
        const empresa_id = req.user.empresa_id;
        const [usuarios] = await pool.query(
            'SELECT id, nombre_completo, email, puesto, rol FROM usuarios WHERE empresa_id = ? ORDER BY id ASC',
            [empresa_id]
        );
        res.json(usuarios);
    } catch (error) { next(error); }
};

// 1. ACTUALIZAR USUARIO (CON CANDADO DE SEGURIDAD ADMIN)
exports.actualizarUsuario = async (req, res, next) => {
    const { id } = req.params;
    const { nombre_completo, puesto, rolSeleccionado } = req.body;
    const empresa_id = req.user.empresa_id;

    try {
        if (rolSeleccionado === 'user') {

            const [usuarioTarget] = await pool.query('SELECT rol FROM usuarios WHERE id = ? AND empresa_id = ?', [id, empresa_id]);

            if (usuarioTarget.length > 0 && usuarioTarget[0].rol === 'admin') {
                const [conteoAdmins] = await pool.query('SELECT COUNT(*) as total FROM usuarios WHERE empresa_id = ? AND rol = "admin"', [empresa_id]);

                if (conteoAdmins[0].total <= 1) {
                    return res.status(400).json({
                        mensaje: 'Acción denegada: Debe haber al menos un Administrador activo en la empresa.'
                    });
                }
            }
        }

        await pool.query(
            'UPDATE usuarios SET nombre_completo = ?, puesto = ?, rol = ? WHERE id = ? AND empresa_id = ?',
            [nombre_completo, puesto, rolSeleccionado, id, empresa_id]
        );
        res.json({ mensaje: 'Usuario actualizado exitosamente' });
    } catch (error) { next(error); }
};

// 2. ELIMINAR USUARIO
exports.eliminarUsuario = async (req, res, next) => {
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;

    try {
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ mensaje: 'No puedes eliminarte a ti mismo por seguridad.' });
        }
        await pool.query('DELETE FROM usuarios WHERE id = ? AND empresa_id = ?', [id, empresa_id]);
        res.json({ mensaje: 'Usuario eliminado' });
    } catch (error) { next(error); }
};

// 3. OBTENER FACTURAS DEL USUARIO
exports.obtenerFacturasUsuario = async (req, res, next) => {
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;

    try {
        const [facturas] = await pool.query(
            `SELECT f.id, f.estado, f.monto, f.fecha, c.rfc as rfcCliente
             FROM facturas f
             JOIN clientes c ON f.cliente_id = c.id
             WHERE f.usuario_id = ? AND f.empresa_id = ?
             ORDER BY f.id DESC`,
            [id, empresa_id]
        );
        res.json(facturas);
    } catch (error) { next(error); }
};