const pool = require('../config/db');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.registrarUsuario = async (req, res, next) => {
    const { email, password, rol } = req.body;
    try {
        const [existente] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (existente.length > 0) return res.status(400).json({ mensaje: 'El usuario ya existe' });

        const salt = await bcryptjs.genSalt(10);
        const passHasheada = await bcryptjs.hash(password, salt);
        const rolAsignado = rol === 'admin' ? 'admin' : 'user';

        const [result] = await pool.query(
            'INSERT INTO usuarios (email, password, rol) VALUES (?, ?, ?)',
            [email, passHasheada, rolAsignado]
        );
        res.status(201).json({ mensaje: 'Usuario registrado', id: result.insertId });
    } catch (error) { next(error); }
};

exports.autenticarUsuario = async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const [usuarios] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (usuarios.length === 0) return res.status(400).json({ mensaje: 'Credenciales incorrectas' });

        const user = usuarios[0];
        const passCorrecto = await bcryptjs.compare(password, user.password);
        if (!passCorrecto) return res.status(400).json({ mensaje: 'Credenciales incorrectas' });

        const payload = { user: { id: user.id, rol: user.rol } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' }, (error, token) => {
            if (error) throw error;
            res.json({ token, usuario: { email: user.email, rol: user.rol } });
        });
    } catch (error) { next(error); }
};