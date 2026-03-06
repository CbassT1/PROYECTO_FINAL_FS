const pool = require('../config/db');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. REGISTRO DE LA EMPRESA
exports.registrarEmpresa = async (req, res, next) => {
    const { rfc, nombre, password } = req.body;
    try {
        const [existente] = await pool.query('SELECT * FROM empresas WHERE rfc = ?', [rfc]);
        if (existente.length > 0) return res.status(400).json({ mensaje: 'Esta empresa ya está registrada' });

        const salt = await bcryptjs.genSalt(10);
        const passHasheada = await bcryptjs.hash(password, salt);

        const [result] = await pool.query(
            'INSERT INTO empresas (rfc, nombre, password) VALUES (?, ?, ?)',
            [rfc, nombre, passHasheada]
        );

        const tokenEmpresa = jwt.sign(
            { empresaAuth: { id: result.insertId, rfc } },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(201).json({ mensaje: 'Empresa creada con éxito', tokenEmpresa });
    } catch (error) { next(error); }
};

// 2. REGISTRO DE USUARIOS (Empleados / Administradores)
exports.registrarUsuario = async (req, res, next) => {
    const { email, password, nombre_completo, puesto, rolSeleccionado } = req.body;

    const empresa_id = req.empresaAuth ? req.empresaAuth.id : req.user.empresa_id;

    if (!empresa_id) return res.status(403).json({ mensaje: 'No hay contexto de empresa para registrar este usuario' });

    try {
        const [existente] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (existente.length > 0) return res.status(400).json({ mensaje: 'El correo ya está en uso' });

        const [usuariosEmpresa] = await pool.query('SELECT COUNT(*) as total FROM usuarios WHERE empresa_id = ?', [empresa_id]);
        const esPrimero = usuariosEmpresa[0].total === 0;

        let rolFinal = 'user';

        if (esPrimero) {
            rolFinal = 'admin';
        } else {

            if (req.user && req.user.rol === 'admin' && rolSeleccionado === 'admin') {
                rolFinal = 'admin';
            }
        }

        const salt = await bcryptjs.genSalt(10);
        const passHasheada = await bcryptjs.hash(password, salt);

        await pool.query(
            'INSERT INTO usuarios (empresa_id, email, password, nombre_completo, puesto, rol) VALUES (?, ?, ?, ?, ?, ?)',
            [empresa_id, email, passHasheada, nombre_completo, puesto, rolFinal]
        );

        res.status(201).json({ mensaje: 'Usuario registrado exitosamente', rolAsignado: rolFinal });
    } catch (error) { next(error); }
};

// 3. LOGIN DE USUARIOS (Con validación de RFC de Empresa)
exports.loginUsuario = async (req, res, next) => {
    const { rfc, email, password } = req.body;
    try {
        const [usuarios] = await pool.query(`
            SELECT u.*, e.nombre as nombre_empresa, e.rfc as rfc_empresa
            FROM usuarios u
            JOIN empresas e ON u.empresa_id = e.id
            WHERE u.email = ? AND e.rfc = ?
        `, [email, rfc]);

        if (usuarios.length === 0) return res.status(400).json({ mensaje: 'Credenciales o RFC incorrectos' });

        const usuario = usuarios[0];
        const passCorrecta = await bcryptjs.compare(password, usuario.password);
        if (!passCorrecta) return res.status(400).json({ mensaje: 'Credenciales o RFC incorrectos' });

        const token = jwt.sign(
            { user: { id: usuario.id, empresa_id: usuario.empresa_id, rol: usuario.rol, nombre: usuario.nombre_completo } },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre_completo,
                puesto: usuario.puesto,
                rol: usuario.rol,
                empresa_id: usuario.empresa_id,
                empresa_nombre: usuario.nombre_empresa
            }
        });
    } catch (error) { next(error); }
};
