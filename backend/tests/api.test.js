const request = require('supertest');
const app = require('../server'); // Importamos tu servidor
const jwt = require('jsonwebtoken');

jest.mock('../config/db', () => ({
    query: jest.fn()
}));
const pool = require('../config/db');

const tokenUser = jwt.sign({ user: { id: 1, rol: 'user' } }, process.env.JWT_SECRET || 'secreto', { expiresIn: '1h' });
const tokenAdmin = jwt.sign({ user: { id: 2, rol: 'admin' } }, process.env.JWT_SECRET || 'secreto', { expiresIn: '1h' });

describe('🧪 Pruebas Automatizadas de la API de Facturación', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('1. Debe rechazar el login con credenciales incorrectas (Login fallido)', async () => {
        pool.query.mockResolvedValue([[]]); // Simulamos que la BD no encontró el correo

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'noexiste@correo.com', password: 'badpassword' });

        expect(res.statusCode).toBe(400);
        expect(res.body.mensaje).toBe('Credenciales incorrectas');
    });

    it('2. Debe rechazar la creación de factura si no hay token (Validación fallida)', async () => {
        const res = await request(app)
            .post('/api/facturas')
            .send({ rfcCliente: 'XAXX010101000' }); 

        expect(res.statusCode).toBe(401);
        expect(res.body.mensaje).toMatch(/No hay token/i);
    });

    it('3. Debe crear una factura exitosamente como Borrador (Crear registro)', async () => {
        pool.query.mockResolvedValue([{ insertId: 99 }]); // Simulamos inserción exitosa

        const res = await request(app)
            .post('/api/facturas')
            .set('Authorization', `Bearer ${tokenUser}`)
            .send({
                rfcCliente: 'XAXX010101000',
                monto: 1500,
                cantidad: 1,
                tipo: 'Servicio',
                descripcion: '{}'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.mensaje).toMatch(/Factura creada/i);
    });

    it('4. Debe listar las facturas del sistema (Listar registros)', async () => {
        pool.query
            .mockResolvedValueOnce([[{ id: 1, rfcCliente: 'ABC' }]]) // Simula la lista de facturas
            .mockResolvedValueOnce([[{ total: 1 }]]); // Simula el conteo total

        const res = await request(app)
            .get('/api/facturas')
            .set('Authorization', `Bearer ${tokenUser}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('datos');
        expect(res.body.datos.length).toBe(1);
    });

    it('5. Debe aplicar filtros y paginación en el listado (Paginación o filtros)', async () => {
        pool.query
            .mockResolvedValueOnce([[]])
            .mockResolvedValueOnce([[{ total: 0 }]]);

        const res = await request(app)
            .get('/api/facturas?page=2&limit=5&estado=Borrador')
            .set('Authorization', `Bearer ${tokenUser}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.pagina).toBe(2);
        expect(res.body.limite).toBe(5);
    });

    it('6. Debe denegar a un usuario normal eliminar una factura (Acceso denegado por rol)', async () => {
        const res = await request(app)
            .delete('/api/facturas/1')
            .set('Authorization', `Bearer ${tokenUser}`); // Usamos token de Usuario Normal

        expect(res.statusCode).toBe(403);
        expect(res.body.mensaje).toMatch(/Solo administradores/i);
    });

    it('7. Debe permitir a un administrador eliminar una factura (Acceso permitido por rol)', async () => {
        pool.query.mockResolvedValue([{ affectedRows: 1 }]); // Simulamos borrado en BD

        const res = await request(app)
            .delete('/api/facturas/1')
            .set('Authorization', `Bearer ${tokenAdmin}`); // Usamos token de Admin

        expect(res.statusCode).toBe(200);
        expect(res.body.mensaje).toMatch(/eliminada/i);
    });

    it('8. Debe retornar un token al hacer login exitoso (Login exitoso)', async () => {
        // Interceptamos bcrypt para que valide la contraseña sin tener que hashearla de verdad
        const bcryptjs = require('bcryptjs');
        jest.spyOn(bcryptjs, 'compare').mockResolvedValue(true);

        pool.query.mockResolvedValue([[{ id: 1, email: 'admin@admin.com', password: 'hash', rol: 'admin' }]]);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@admin.com', password: 'password123' });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.usuario.rol).toBe('admin');
    });
});
