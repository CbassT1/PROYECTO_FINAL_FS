const request = require('supertest');
const app = require('../server'); 
const jwt = require('jsonwebtoken');

jest.mock('../config/db', () => ({
    query: jest.fn()
}));
const pool = require('../config/db');

const tokenUser = jwt.sign({ user: { id: 1, rol: 'user' } }, process.env.JWT_SECRET || 'secreto', { expiresIn: '1h' });
const tokenAdmin = jwt.sign({ user: { id: 2, rol: 'admin' } }, process.env.JWT_SECRET || 'secreto', { expiresIn: '1h' });

describe('🧪 Pruebas Automatizadas (Simulación de Errores para Reporte)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('1. Debe rechazar el login con credenciales incorrectas (Simulando Fallo)', async () => {
        pool.query.mockResolvedValue([[]]); 

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'noexiste@correo.com', password: 'badpassword' });

        // Provocamos fallo: Esperamos 200 cuando sabemos que dará 400
        expect(res.statusCode).toBe(200); 
    });

    it('2. Debe rechazar la creación de factura si no hay token (Validación pasará)', async () => {
        const res = await request(app)
            .post('/api/facturas')
            .send({ rfcCliente: 'XAXX010101000' }); 

        expect(res.statusCode).toBe(401);
    });

    // --- PRUEBA 3: FALLARÁ ---
    // Cambiamos el mensaje esperado para que no coincida
    it('3. Debe crear una factura exitosamente (Simulando Fallo de mensaje)', async () => {
        pool.query.mockResolvedValue([{ insertId: 99 }]); 

        const res = await request(app)
            .post('/api/facturas')
            .set('Authorization', `Bearer ${tokenUser}`)
            .send({ rfcCliente: 'RFC123', monto: 100, cantidad: 1, tipo: 'P', descripcion: '{}' });

        // Provocamos fallo: El mensaje real es "Factura creada", aquí esperamos "Error"
        expect(res.body.mensaje).toBe('Error en el servidor'); 
    });

    it('4. Debe listar las facturas del sistema (Validación pasará)', async () => {
        pool.query
            .mockResolvedValueOnce([[{ id: 1, rfcCliente: 'ABC' }]]) 
            .mockResolvedValueOnce([[{ total: 1 }]]); 

        const res = await request(app)
            .get('/api/facturas')
            .set('Authorization', `Bearer ${tokenUser}`);

        expect(res.statusCode).toBe(200);
    });

    // Esperamos estar en la página 10 cuando el código nos pondrá en la 2
    it('5. Debe aplicar filtros y paginación (Simulando Fallo de página)', async () => {
        pool.query.mockResolvedValueOnce([[]]).mockResolvedValueOnce([[{ total: 0 }]]);

        const res = await request(app)
            .get('/api/facturas?page=2&limit=5')
            .set('Authorization', `Bearer ${tokenUser}`);

        // Provocamos fallo: Pedimos página 2 pero el test "insiste" en que debería ser la 10
        expect(res.body.pagina).toBe(10); 
    });

    it('6. Debe denegar a un usuario normal eliminar una factura (Validación pasará)', async () => {
        const res = await request(app)
            .delete('/api/facturas/1')
            .set('Authorization', `Bearer ${tokenUser}`); 

        expect(res.statusCode).toBe(403);
    });

    it('7. Debe permitir a un administrador eliminar una factura (Validación pasará)', async () => {
        pool.query.mockResolvedValue([{ affectedRows: 1 }]); 

        const res = await request(app)
            .delete('/api/facturas/1')
            .set('Authorization', `Bearer ${tokenAdmin}`); 

        expect(res.statusCode).toBe(200);
    });

    // --- PRUEBA 8: FALLARÁ ---
    // El sistema devuelve rol 'admin', pero el test esperará 'visitante'
    it('8. Debe retornar un token al hacer login (Simulando Fallo de Rol)', async () => {
        const bcryptjs = require('bcryptjs');
        jest.spyOn(bcryptjs, 'compare').mockResolvedValue(true);
        pool.query.mockResolvedValue([[{ id: 1, email: 'a@a.com', password: 'h', rol: 'admin' }]]);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'a@a.com', password: '123' });

        // Provocamos fallo: Esperamos rol 'visitante'
        expect(res.body.usuario.rol).toBe('visitante');
    });
});