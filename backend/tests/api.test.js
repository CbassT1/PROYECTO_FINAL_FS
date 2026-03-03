const request = require('supertest');
const app = require('../server');
const pool = require('../config/db');

let tokenUser = '';
let tokenAdmin = '';
let facturaId = '';

beforeAll(async () => {
    // Limpiamos datos de prueba previos si existen
    await pool.query('DELETE FROM facturas');
    await pool.query('DELETE FROM usuarios WHERE email LIKE "%@test.com"');

    // Registro de usuarios para pruebas
    await request(app).post('/api/auth/register').send({ email: 'user@test.com', password: 'password123', rol: 'user' });
    await request(app).post('/api/auth/register').send({ email: 'admin@test.com', password: 'password123', rol: 'admin' });
});

afterAll(async () => {
  await pool.end(); // IMPORTANTE: Esto cierra la conexión a MySQL
});

describe('Pruebas de API de Facturación', () => {
    
    test('1. Login fallido - Credenciales incorrectas', async () => {
        const res = await request(app).post('/api/auth/login').send({ email: 'user@test.com', password: 'wrongpassword' });
        expect(res.statusCode).toBe(400);
    });

    test('2. Login exitoso - Obtención de Token JWT', async () => {
        const res = await request(app).post('/api/auth/login').send({ email: 'user@test.com', password: 'password123' });
        tokenUser = res.body.token;
        
        const resAdmin = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'password123' });
        tokenAdmin = resAdmin.body.token;
        expect(res.statusCode).toBe(200);
        expect(tokenUser).toBeDefined();
    });

    test('3. Validación fallida - Registro incompleto', async () => {
        const res = await request(app).post('/api/facturas').set('Authorization', `Bearer ${tokenUser}`).send({ monto: 100 });
        expect(res.statusCode).toBe(400); // Falta RFC y descripción
    });

    test('4. Crear registro - Factura en Borrador', async () => {
        const res = await request(app).post('/api/facturas').set('Authorization', `Bearer ${tokenUser}`).send({
            rfcCliente: 'XAXX010101000', monto: 500, cantidad: 1, tipo: 'Servicio', descripcion: 'Test'
        });
        facturaId = res.body.id;
        expect(res.statusCode).toBe(201);
    });

    test('5. Listar registros - Ver todas las facturas', async () => {
        const res = await request(app).get('/api/facturas').set('Authorization', `Bearer ${tokenUser}`);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.datos)).toBeTruthy();
    });

    test('6. Paginación - Aplicar límites', async () => {
        const res = await request(app).get('/api/facturas?limit=1').set('Authorization', `Bearer ${tokenUser}`);
        expect(res.body.limite).toBe(1);
    });

    test('7. Acceso denegado - Usuario no puede cancelar', async () => {
        const res = await request(app).patch(`/api/facturas/${facturaId}/estado`).set('Authorization', `Bearer ${tokenUser}`).send({ nuevoEstado: 'Cancelada' });
        expect(res.statusCode).toBe(403); // Solo admin puede cancelar
    });

    test('8. Acceso permitido - Admin elimina factura', async () => {
        const res = await request(app).delete(`/api/facturas/${facturaId}`).set('Authorization', `Bearer ${tokenAdmin}`);
        expect(res.statusCode).toBe(200);
    });
});