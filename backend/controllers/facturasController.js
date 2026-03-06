const pool = require('../config/db');

// 1. GUARDAR CLIENTE NUEVO
exports.crearCliente = async (req, res, next) => {
    const { rfc, razonSocial, regimenFiscal, direccion } = req.body;
    const empresa_id = req.user.empresa_id;

    try {
        const [existente] = await pool.query('SELECT id FROM clientes WHERE rfc = ? AND empresa_id = ?', [rfc, empresa_id]);
        if (existente.length > 0) return res.status(400).json({ mensaje: 'Este cliente ya existe en tu empresa' });

        const [result] = await pool.query(
            'INSERT INTO clientes (empresa_id, rfc, razon_social, regimen_fiscal, direccion) VALUES (?, ?, ?, ?, ?)',
            [empresa_id, rfc, razonSocial, regimenFiscal, direccion || '']
        );
        res.status(201).json({ mensaje: 'Cliente guardado', id: result.insertId });
    } catch (error) { next(error); }
};

// 2. GUARDAR FACTURA (BORRADOR)
exports.crearFactura = async (req, res, next) => {
    const { cliente_rfc, moneda, metodoPago, formaPago, monto, conceptos } = req.body;
    const empresa_id = req.user.empresa_id;
    const usuario_id = req.user.id; // El usuario que la elaboró

    try {

        const [clienteDb] = await pool.query('SELECT id FROM clientes WHERE rfc = ? AND empresa_id = ?', [cliente_rfc, empresa_id]);
        if (clienteDb.length === 0) return res.status(400).json({ mensaje: 'El cliente no está registrado' });

        const cliente_id = clienteDb[0].id;

        const [result] = await pool.query(
            `INSERT INTO facturas (empresa_id, usuario_id, cliente_id, moneda, metodo_pago, forma_pago, monto, estado, conceptos)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'Borrador', ?)`,
            [empresa_id, usuario_id, cliente_id, moneda, metodoPago, formaPago, monto, JSON.stringify(conceptos)]
        );

        res.status(201).json({ mensaje: 'Borrador guardado exitosamente', id: result.insertId });
    } catch (error) { next(error); }
};

// BUSCAR CLIENTES EN TIEMPO REAL
exports.buscarClientes = async (req, res, next) => {
    const { q } = req.query;
    const empresa_id = req.user.empresa_id;
    if (!q) return res.json([]);

    try {
        const termino = `%${q}%`;
        const [clientes] = await pool.query(
            'SELECT rfc, razon_social AS razonSocial, regimen_fiscal AS regimenFiscal FROM clientes WHERE empresa_id = ? AND (rfc LIKE ? OR razon_social LIKE ?) LIMIT 10',
            [empresa_id, termino, termino]
        );
        res.json(clientes);
    } catch (error) { next(error); }
};