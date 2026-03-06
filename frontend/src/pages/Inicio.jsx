import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import facturasService from '../services/facturas.service';

const Inicio = () => {
    const [facturas, setFacturas] = useState([]);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                // Traemos las últimas facturas
                const data = await facturasService.obtenerTodas(1, 50, 'Todas');
                setFacturas(data.datos || []);
            } catch (error) {
                console.error("Error cargando dashboard:", error);
            }
        };
        cargarDatos();
    }, []);

    // Cálculos para la gráfica y KPIs
    const totalFacturado = facturas.reduce((acc, f) => acc + parseFloat(f.monto), 0);
    const montoPUE = facturas.filter(f => f.metodo_pago === 'PUE').reduce((acc, f) => acc + parseFloat(f.monto), 0);
    const montoPPD = facturas.filter(f => f.metodo_pago === 'PPD').reduce((acc, f) => acc + parseFloat(f.monto), 0);

    // Top 5 recientes
    const recientes = facturas.slice(0, 5);

    // Datos para gráfica de Recharts
    const dataGrafica = [
        { name: 'PUE (Una exhibición)', value: montoPUE || 1 }, // El 1 es para que no salga en blanco si no hay datos
        { name: 'PPD (Parcialidades)', value: montoPPD || 1 }
    ];
    const COLORES = ['#10b981', '#f59e0b']; // Verde y Naranja

    return (
        <div>
            <h2 style={{ marginTop: 0, color: '#0f172a' }}>Resumen General</h2>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#64748b' }}>Total Facturado</h4>
                    <h2 style={{ margin: 0, color: '#0f172a', fontSize: '2rem' }}>${totalFacturado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h2>
                </div>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#64748b' }}>Facturas Registradas</h4>
                    <h2 style={{ margin: 0, color: '#0ea5e9', fontSize: '2rem' }}>{facturas.length}</h2>
                </div>
            </div>

            {/* Dos columnas: Gráfica y Últimas Facturas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

                {/* GRÁFICA */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', height: '350px' }}>
                    <h3 style={{ marginTop: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>Distribución por Método de Pago</h3>
                    <ResponsiveContainer width="100%" height="80%">
                        <PieChart>
                            <Pie data={dataGrafica} cx="50%" cy="50%" innerRadius={60} outerRadius={90} fill="#8884d8" paddingAngle={5} dataKey="value">
                                {dataGrafica.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* ÚLTIMAS FACTURAS */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginTop: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>Últimas Facturas Elaboradas</h3>
                    {recientes.length === 0 ? <p>No hay facturas aún.</p> : (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {recientes.map(f => (
                                <li key={f.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                                    <span><strong>#{f.id}</strong> - {f.estado}</span>
                                    <span style={{ fontWeight: 'bold', color: '#0f172a' }}>${parseFloat(f.monto).toLocaleString()}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Inicio;