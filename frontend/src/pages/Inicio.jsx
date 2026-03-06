import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import facturasService from '../services/facturas.service';

const Inicio = () => {
    const [facturas, setFacturas] = useState([]);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const data = await facturasService.obtenerTodas(1, 50, 'Todas');
                setFacturas(data.datos || []);
            } catch (error) {
                console.error("Error cargando dashboard:", error);
            }
        };
        cargarDatos();
    }, []);

    // 1. Filtramos solo las facturas válidas (Emitidas)
    const facturasEmitidas = facturas.filter(f => f.estado === 'Emitida');

    // 2. CÁLCULO FINANCIERO: Total Facturado
    const totalFacturado = facturasEmitidas.reduce((acc, f) => acc + parseFloat(f.monto), 0);

    // 3. CÁLCULO FINANCIERO: Total Cobrado
    // Si es PUE, se asume cobrada al 100%. Si es PPD, sumamos lo que traiga la tabla de pagos (total_pagado)
    const totalCobrado = facturasEmitidas.reduce((acc, f) => {
        const metodo = f.metodoPago || f.metodo_pago;
        if (metodo === 'PUE') {
            return acc + parseFloat(f.monto);
        } else {
            return acc + parseFloat(f.total_pagado || 0); // Esta variable la enviaremos desde el backend en el próximo paso
        }
    }, 0);

    // 4. CÁLCULO FINANCIERO: Saldo Pendiente (Por Cobrar)
    const porCobrar = totalFacturado - totalCobrado;

    // Top 5 recientes
    const recientes = facturasEmitidas.slice(0, 5);

    // Datos para gráfica de Recharts (Cobrado vs Por Cobrar)
    const dataGrafica = [
        { name: 'Cobrado', value: totalCobrado > 0 ? totalCobrado : 0.01 }, // Evita que la gráfica colapse en ceros
        { name: 'Por Cobrar', value: porCobrar > 0 ? porCobrar : 0.01 }
    ];
    const COLORES = ['#10b981', '#ef4444']; // Verde (Dinero en bolsa) y Rojo (Dinero en la calle)

    return (
        <div>
            <h2 style={{ marginTop: 0, color: '#0f172a' }}>Resumen General</h2>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: '4px solid #3b82f6' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#64748b' }}>Total Facturado</h4>
                    <h2 style={{ margin: 0, color: '#0f172a', fontSize: '2rem' }}>${totalFacturado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h2>
                </div>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: '4px solid #10b981' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#64748b' }}>Total Cobrado</h4>
                    <h2 style={{ margin: 0, color: '#10b981', fontSize: '2rem' }}>${totalCobrado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h2>
                </div>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: '4px solid #ef4444' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#64748b' }}>Por Cobrar</h4>
                    <h2 style={{ margin: 0, color: '#ef4444', fontSize: '2rem' }}>${porCobrar.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h2>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

                {/* GRÁFICA */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', height: '350px' }}>
                    <h3 style={{ marginTop: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', color: '#334155' }}>Relación de Cobranza</h3>
                    <ResponsiveContainer width="100%" height={250}>
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
                    <h3 style={{ marginTop: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', color: '#334155' }}>Últimas Facturas Emitidas</h3>
                    {recientes.length === 0 ? <p style={{ color: '#94a3b8' }}>No hay facturas emitidas aún.</p> : (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {recientes.map(f => (
                                <li key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                                    <div>
                                        <span style={{ display: 'block', fontWeight: 'bold', color: '#0f172a' }}>#{f.id} - {f.rfcCliente || 'Sin RFC'}</span>
                                        <span style={{ fontSize: '0.8rem', color: '#10b981' }}>Emitida</span>
                                    </div>
                                    <span style={{ fontWeight: 'bold', color: '#0f172a' }}>${parseFloat(f.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
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
