const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ mensaje: 'No hay token, permiso denegado' });

    try {
        const cifrado = jwt.verify(token, process.env.JWT_SECRET);
        req.user = cifrado.user;
        next();
    } catch (error) {
        res.status(401).json({ mensaje: 'Token no válido' });
    }
};

const esAdmin = (req, res, next) => {
    if (req.user.rol !== 'admin') {
        return res.status(403).json({ mensaje: 'Acceso denegado. Solo administradores.' });
    }
    next();
};

module.exports = { verificarToken, esAdmin };