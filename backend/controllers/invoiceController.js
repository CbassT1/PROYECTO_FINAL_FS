const pool = require('../config/db');

// OBTENER TODAS LAS FACTURAS (CON FILTROS, PAGINACIÓN Y SUMA DE PAGOS)
exports.obtenerFacturas = async (req, res, next) => {
    const empresa_id = req.user.empresa_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;
    const estado = req.query.estado || 'Todas';
    const search = req.query.search || '';

    try {
        let query = `
            SELECT f.*, c.rfc AS rfcCliente, c.razon_social AS razonSocialCliente,
                   IFNULL(SUM(p.monto_pagado), 0) AS total_pagado
            FROM facturas f
            JOIN clientes c ON f.cliente_id = c.id
            LEFT JOIN pagos p ON f.id = p.factura_id
            WHERE f.empresa_id = ?
        `;
        const queryParams = [empresa_id];

        if (estado !== 'Todas') {
            query += ` AND f.estado = ?`;
            queryParams.push(estado);
        }

        if (search) {
            query += ` AND c.rfc LIKE ?`;
            queryParams.push(`%${search}%`);
        }

        query += ` GROUP BY f.id`;
        query += ` ORDER BY f.fecha DESC LIMIT ? OFFSET ?`;
        queryParams.push(limit, offset);

        const [facturas] = await pool.query(query, queryParams);

        // Conteo total para la paginación
        let countQuery = `
            SELECT COUNT(*) as total
            FROM facturas f
            JOIN clientes c ON f.cliente_id = c.id
            WHERE f.empresa_id = ?
        `;
        const countParams = [empresa_id];

        if (estado !== 'Todas') {
            countQuery += ` AND f.estado = ?`;
            countParams.push(estado);
        }
        if (search) {
            countQuery += ` AND c.rfc LIKE ?`;
            countParams.push(`%${search}%`);
        }

        const [totalRows] = await pool.query(countQuery, countParams);
        const totalPaginas = Math.ceil(totalRows[0].total / limit);

        res.json({
            datos: facturas,
            totalPaginas,
            paginaActual: page
        });
    } catch (error) { next(error); }
};

// OBTENER UNA FACTURA POR ID
exports.obtenerFacturaPorId = async (req, res, next) => {
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;
    try {
        const [factura] = await pool.query(
            `SELECT f.*, c.rfc AS rfcCliente, c.razon_social AS razonSocialCliente, c.regimen_fiscal AS regimenFiscalCliente, c.uso_cfdi AS usoCFDICliente
             FROM facturas f
             JOIN clientes c ON f.cliente_id = c.id
             WHERE f.id = ? AND f.empresa_id = ?`,
            [id, empresa_id]
        );
        if (factura.length === 0) return res.status(404).json({ mensaje: 'Factura no encontrada' });
        res.json(factura[0]);
    } catch (error) { next(error); }
};

// ACTUALIZAR BORRADOR
exports.actualizarFactura = async (req, res, next) => {
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;
    const { cliente_rfc, moneda, metodoPago, formaPago, monto, conceptos } = req.body;

    try {
        const [cliente] = await pool.query('SELECT id FROM clientes WHERE rfc = ? AND empresa_id = ?', [cliente_rfc, empresa_id]);
        if (cliente.length === 0) return res.status(404).json({ mensaje: 'Cliente no encontrado' });

        await pool.query(
            'UPDATE facturas SET cliente_id = ?, moneda = ?, metodo_pago = ?, forma_pago = ?, monto = ?, conceptos = ? WHERE id = ? AND empresa_id = ?',
            [cliente[0].id, moneda, metodoPago, formaPago, monto, JSON.stringify(conceptos), id, empresa_id]
        );
        res.json({ mensaje: 'Factura actualizada' });
    } catch(error) { next(error); }
};

// CAMBIAR ESTADO (Emitir, Cancelar)
exports.cambiarEstado = async (req, res, next) => {
    const { id } = req.params;
    const { estado } = req.body;
    const empresa_id = req.user.empresa_id;
    try {
        await pool.query('UPDATE facturas SET estado = ? WHERE id = ? AND empresa_id = ?', [estado, id, empresa_id]);
        res.json({ mensaje: 'Estado actualizado' });
    } catch (error) { next(error); }
};

// ELIMINAR BORRADOR
exports.eliminarFactura = async (req, res, next) => {
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;
    try {
        await pool.query('DELETE FROM facturas WHERE id = ? AND empresa_id = ?', [id, empresa_id]);
        res.json({ mensaje: 'Factura eliminada' });
    } catch (error) { next(error); }
};

// REGISTRAR UN ABONO A FACTURA PPD
exports.agregarPago = async (req, res, next) => {
    const { id } = req.params;
    const { monto_pagado, forma_pago } = req.body;
    const empresa_id = req.user.empresa_id;

    try {
        const [factura] = await pool.query('SELECT monto, estado FROM facturas WHERE id = ? AND empresa_id = ?', [id, empresa_id]);
        if (factura.length === 0) return res.status(404).json({ mensaje: 'Factura no encontrada' });

        const [pagosPrevios] = await pool.query('SELECT SUM(monto_pagado) as total FROM pagos WHERE factura_id = ?', [id]);
        const totalPagado = parseFloat(pagosPrevios[0].total || 0) + parseFloat(monto_pagado);

        if (totalPagado > parseFloat(factura[0].monto)) {
            return res.status(400).json({ mensaje: 'El abono supera el saldo pendiente de esta factura.' });
        }

        await pool.query(
            'INSERT INTO pagos (factura_id, monto_pagado, forma_pago) VALUES (?, ?, ?)',
            [id, monto_pagado, forma_pago]
        );

        res.json({ mensaje: 'Abono registrado correctamente' });
    } catch (error) { next(error); }
};
