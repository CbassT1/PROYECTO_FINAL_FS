const pool = require('../config/db');

exports.crearFactura = async (req, res, next) => {
    try {
        const { rfcCliente, monto, cantidad, tipo, descripcion } = req.body;
        const [result] = await pool.query(
            'INSERT INTO facturas (user_id, rfcCliente, monto, cantidad, tipo, descripcion, estado) VALUES (?, ?, ?, ?, ?, ?, "Borrador")',
            [req.user.id, rfcCliente, monto, cantidad, tipo, descripcion]
        );
        res.status(201).json({ id: result.insertId, mensaje: 'Factura creada en Borrador' });
    } catch (error) { next(error); }
};

exports.obtenerFacturas = async (req, res, next) => {
    try {
        const limite = parseInt(req.query.limit) || 10;
        const pagina = parseInt(req.query.page) || 1;
        const offset = (pagina - 1) * limite;
        
        const [rows] = await pool.query('SELECT * FROM facturas LIMIT ? OFFSET ?', [limite, offset]);
        res.json({ pagina, limite, datos: rows });
    } catch (error) { next(error); }
};

exports.obtenerFacturaPorId = async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT * FROM facturas WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ mensaje: 'Factura no encontrada' });
        res.json(rows[0]);
    } catch (error) { next(error); }
};

exports.actualizarFactura = async (req, res, next) => {
    try {
        const { rfcCliente, monto, cantidad, tipo, descripcion } = req.body;
        const [result] = await pool.query(
            'UPDATE facturas SET rfcCliente = ?, monto = ?, cantidad = ?, tipo = ?, descripcion = ? WHERE id = ?',
            [rfcCliente, monto, cantidad, tipo, descripcion, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ mensaje: 'Factura no encontrada' });
        res.json({ mensaje: 'Factura actualizada por el administrador' });
    } catch (error) { next(error); }
};

exports.cambiarEstado = async (req, res, next) => {
    try {
        const { nuevoEstado } = req.body;
        const rol = req.user.rol;

        if (rol === 'user' && !['Borrador', 'Emitida'].includes(nuevoEstado)) {
            return res.status(403).json({ mensaje: 'Los usuarios solo pueden cambiar a Borrador o Emitida.' });
        }
        if (rol === 'admin' && nuevoEstado !== 'Cancelada') {
            return res.status(403).json({ mensaje: 'El administrador utiliza esta ruta para Cancelar facturas.' });
        }

        const [result] = await pool.query('UPDATE facturas SET estado = ? WHERE id = ?', [nuevoEstado, req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ mensaje: 'Factura no encontrada' });
        res.json({ mensaje: `Estado actualizado a ${nuevoEstado}` });
    } catch (error) { next(error); }
};

exports.eliminarFactura = async (req, res, next) => {
    try {
        const [result] = await pool.query('DELETE FROM facturas WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ mensaje: 'Factura no encontrada' });
        res.json({ mensaje: 'Factura eliminada permanentemente' });
    } catch (error) { next(error); }
};