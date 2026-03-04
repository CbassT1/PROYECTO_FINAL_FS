const pool = require('../config/db');

exports.crearFactura = async (req, res, next) => {
    const { rfcCliente, monto, cantidad, tipo, descripcion } = req.body;
    const user_id = req.user.id;

    try {
        const [result] = await pool.query(
            'INSERT INTO facturas (user_id, rfcCliente, monto, cantidad, tipo, descripcion, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [user_id, rfcCliente, monto, cantidad, tipo, descripcion, 'Borrador']
        );
        res.status(201).json({ mensaje: 'Factura creada', id: result.insertId });
    } catch (error) {
        next(error);
    }
};

exports.obtenerFacturas = async (req, res, next) => {
    try {
        const limite = parseInt(req.query.limit) || 10;
        const pagina = parseInt(req.query.page) || 1;
        const offset = (pagina - 1) * limite;
        const { estado, rfc } = req.query; 

        let query = 'SELECT * FROM facturas WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) as total FROM facturas WHERE 1=1';
        const params = [];

        if (estado && estado !== 'Todas') {
            query += ' AND estado = ?';
            countQuery += ' AND estado = ?';
            params.push(estado);
        }

        if (rfc) {
            query += ' AND rfcCliente LIKE ?';
            countQuery += ' AND rfcCliente LIKE ?';
            params.push(`%${rfc}%`); 
        }

        query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
        const queryParams = [...params, limite, offset];

        const [rows] = await pool.query(query, queryParams);
        const [countRows] = await pool.query(countQuery, params);
        const total = countRows[0].total;

        res.json({
            pagina,
            limite,
            total,
            totalPaginas: Math.ceil(total / limite),
            datos: rows
        });
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

        if (rol === 'admin' && !['Cancelada', 'Emitida'].includes(nuevoEstado)) {
            return res.status(403).json({ mensaje: 'El administrador solo puede cambiar a Emitida o Cancelada.' });
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