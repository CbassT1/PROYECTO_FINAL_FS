const pool = require('../config/db');

exports.obtenerFacturas = async (req, res, next) => {
    try {
<<<<<<< HEAD
        const empresa_id = req.user.empresa_id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const offset = (page - 1) * limit;
        const estado = req.query.estado || 'Todas';
        const search = req.query.search || '';
=======
        const limite = parseInt(req.query.limit) || 10;
        const pagina = parseInt(req.query.page) || 1;
        const offset = (pagina - 1) * limite;
        const { estado, rfc } = req.query; 
>>>>>>> 5f91839973e0139193a4a8306167e39f341d9ce5

        let query = `
            SELECT f.*, c.rfc AS rfcCliente, c.razon_social AS razonSocialCliente,
                   IFNULL(SUM(p.monto_pagado), 0) AS total_pagado
            FROM facturas f
            JOIN clientes c ON f.cliente_id = c.id
            LEFT JOIN pagos p ON f.id = p.factura_id
            WHERE f.empresa_id = ?
        `;

        let countQuery = `
            SELECT COUNT(*) as total
            FROM facturas f
            JOIN clientes c ON f.cliente_id = c.id
            WHERE f.empresa_id = ?
        `;

        let params = [empresa_id];
        let countParams = [empresa_id];

        if (estado !== 'Todas') {
            query += ` AND f.estado = ?`;
            countQuery += ` AND f.estado = ?`;
            params.push(estado);
            countParams.push(estado);
        }

<<<<<<< HEAD
        if (search) {
            query += ` AND c.rfc LIKE ?`;
            countQuery += ` AND c.rfc LIKE ?`;
            params.push(`%${search}%`);
            countParams.push(`%${search}%`);
=======
        if (rfc) {
            query += ' AND rfcCliente LIKE ?';
            countQuery += ' AND rfcCliente LIKE ?';
            params.push(`%${rfc}%`); 
>>>>>>> 5f91839973e0139193a4a8306167e39f341d9ce5
        }

        query += ` GROUP BY f.id`;
        query += ` ORDER BY f.fecha DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const [facturas] = await pool.query(query, params);
        const [totalRows] = await pool.query(countQuery, countParams);
        const totalPaginas = Math.ceil(totalRows[0].total / limit);

        const facturasFormateadas = facturas.map(f => ({
            ...f,
            metodoPago: f.metodo_pago,
            formaPago: f.forma_pago,
            conceptos: typeof f.conceptos === 'string' ? JSON.parse(f.conceptos) : f.conceptos
        }));

        res.json({
            datos: facturasFormateadas,
            totalPaginas,
            paginaActual: page
        });
    } catch (error) { next(error); }
};

exports.obtenerFacturaPorId = async (req, res, next) => {
    // Pendiente para cuando hagamos la descarga en PDF
    res.json({ mensaje: "En construcción" });
};

exports.cambiarEstado = async (req, res, next) => {
    const { id } = req.params;
    const { estado } = req.body;
    try {
        await pool.query('UPDATE facturas SET estado = ? WHERE id = ?', [estado, id]);
        res.json({ mensaje: 'Estado actualizado' });
    } catch (error) { next(error); }
};

exports.actualizarFactura = async (req, res, next) => {
    const { id } = req.params;
    const { cliente_rfc, moneda, metodoPago, formaPago, monto, conceptos } = req.body;
    const empresa_id = req.user.empresa_id;

    try {
        // Buscamos el ID del cliente basado en el RFC que nos manda React
        const [clienteDb] = await pool.query('SELECT id FROM clientes WHERE rfc = ? AND empresa_id = ?', [cliente_rfc, empresa_id]);
        if (clienteDb.length === 0) return res.status(400).json({ mensaje: 'El cliente no está registrado' });

        const cliente_id = clienteDb[0].id;

        // Actualizamos la factura
        await pool.query(
            `UPDATE facturas
             SET cliente_id = ?, moneda = ?, metodo_pago = ?, forma_pago = ?, monto = ?, conceptos = ?
             WHERE id = ? AND empresa_id = ? AND estado = 'Borrador'`,
            [cliente_id, moneda, metodoPago, formaPago, monto, JSON.stringify(conceptos), id, empresa_id]
        );

        res.json({ mensaje: 'Borrador actualizado exitosamente' });
    } catch (error) { next(error); }
};

exports.eliminarFactura = async (req, res, next) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM facturas WHERE id = ?', [id]);
        res.json({ mensaje: 'Borrador eliminado' });
    } catch (error) { next(error); }
};

// REGISTRAR UN ABONO A FACTURA PPD
exports.agregarPago = async (req, res, next) => {
    const { id } = req.params; // ID de la factura
    const { monto_pagado, forma_pago } = req.body;
    const empresa_id = req.user.empresa_id;

    try {
        // 1. Validamos que la factura exista y sea de esta empresa
        const [factura] = await pool.query('SELECT monto, estado FROM facturas WHERE id = ? AND empresa_id = ?', [id, empresa_id]);
        if (factura.length === 0) return res.status(404).json({ mensaje: 'Factura no encontrada' });

        // 2. Calculamos cuánto se ha pagado hasta ahora
        const [pagosPrevios] = await pool.query('SELECT SUM(monto_pagado) as total FROM pagos WHERE factura_id = ?', [id]);
        const totalPagado = parseFloat(pagosPrevios[0].total || 0) + parseFloat(monto_pagado);

        // 3. Bloqueamos si intentan cobrar de más
        if (totalPagado > parseFloat(factura[0].monto)) {
            return res.status(400).json({ mensaje: 'El abono supera el saldo pendiente de esta factura.' });
        }

        // 4. Guardamos el abono
        await pool.query(
            'INSERT INTO pagos (factura_id, monto_pagado, forma_pago) VALUES (?, ?, ?)',
            [id, monto_pagado, forma_pago]
        );

        res.json({ mensaje: 'Abono registrado correctamente' });
    } catch (error) { next(error); }
};