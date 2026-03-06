require('dotenv').config();
const xlsx = require('xlsx');
const path = require('path');
const pool = require('./config/db');

async function poblarUnidades() {
    console.log('⏳ Leyendo unidades_medida.xlsx...');
    const filePath = path.join(__dirname, 'data', 'unidades_medida.xlsx');
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]]; // Tomamos la primera hoja

    // {header: 1} lo convierte en un arreglo limpio. slice(1) ignora la fila de títulos.
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 }).slice(1);

    // Filtramos filas vacías y aseguramos que sean texto
    const values = rows
        .filter(row => row[0] && row[1])
        .map(row => [row[0].toString().trim(), row[1].toString().trim()]);

    console.log(`🚀 Insertando ${values.length} unidades en MySQL...`);
    const query = 'INSERT IGNORE INTO catalogo_unidades (clave, nombre) VALUES ?';
    await pool.query(query, [values]);
    console.log('✅ Unidades guardadas exitosamente.\n');
}

async function poblarClaves() {
    console.log('⏳ Leyendo claves_sat.xlsx (Esto puede tomar unos segundos)...');
    const filePath = path.join(__dirname, 'data', 'claves_sat.xlsx');
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 }).slice(1);

    const values = rows
        .filter(row => row[0] && row[1])
        .map(row => [row[0].toString().trim(), row[1].toString().trim()]);

    console.log(`🚀 Insertando ${values.length} claves de productos/servicios en MySQL...`);
    const query = 'INSERT IGNORE INTO catalogo_claves (clave, descripcion) VALUES ?';

    // Inserción masiva
    await pool.query(query, [values]);
    console.log('✅ Claves guardadas exitosamente.\n');
}

async function ejecutar() {
    try {
        await poblarUnidades();
        await poblarClaves();
        console.log('🎉 ¡Misión cumplida! Todos los catálogos del SAT están en tu Base de Datos.');
        process.exit(0); // Apaga el script automáticamente al terminar
    } catch (error) {
        console.error('❌ Error fatal al poblar la base de datos:', error);
        process.exit(1);
    }
}

// Arrancamos el motor
ejecutar();