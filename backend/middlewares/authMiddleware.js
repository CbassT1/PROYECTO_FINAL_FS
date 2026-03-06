const jwt = require('jsonwebtoken');

exports.verificarToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) return res.status(401).json({ mensaje: 'No hay token, permiso denegado' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ mensaje: 'Formato de token inválido' });

    try {
<<<<<<< HEAD
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Identificamos qué tipo de sesión es
        if (decoded.user) req.user = decoded.user;                 // Token de Empleado/Admin
        if (decoded.empresaAuth) req.empresaAuth = decoded.empresaAuth; // Token temporal de Empresa

=======
        const cifrado = jwt.verify(token, process.env.JWT_SECRET);
        req.user = cifrado.user;
>>>>>>> 5f91839973e0139193a4a8306167e39f341d9ce5
        next();
    } catch (error) {
        res.status(401).json({ mensaje: 'Token no válido o expirado' });
    }
};

exports.esAdmin = (req, res, next) => {
    if (!req.user || req.user.rol !== 'admin') {
        return res.status(403).json({ mensaje: 'Acceso denegado: Solo administradores' });
    }
    next();
};
