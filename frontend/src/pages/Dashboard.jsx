import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import facturasService from '../services/facturas.service';
import InvoiceDetailModal from '../components/InvoiceDetailModal';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const [facturas, setFacturas] = useState([]);
    const [loading, setLoading] = useState(true);

    const [paginaActual, setPaginaActual] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [filtroEstado, setFiltroEstado] = useState('Todas');
    const [busquedaRFC, setBusquedaRFC] = useState('');

    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);

    // NUEVOS ESTADOS PARA EL MODAL DE PAGOS
    const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);
    const [facturaAbono, setFacturaAbono] = useState(null);
    const [datosPago, setDatosPago] = useState({ monto_pagado: '', forma_pago: '03' });

    const cargarFacturas = async () => {
        try {
            setLoading(true);
            const data = await facturasService.obtenerTodas(paginaActual, 5, filtroEstado, busquedaRFC);
            setFacturas(data.datos || []);
            setTotalPaginas(data.totalPaginas || 1);
        } catch (error) {
            console.error('Error al cargar facturas:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) navigate('/login');
        else cargarFacturas();
    }, [paginaActual, filtroEstado]);

    const handleBuscarPorRFC = (e) => {
        e.preventDefault();
        setPaginaActual(1);
        cargarFacturas();
    };

    const handleEmitir = async (id) => {
        try {
            await facturasService.cambiarEstado(id, 'Emitida');
            cargarFacturas();
        } catch (error) { alert(error.response?.data?.mensaje || 'Error al emitir factura'); }
    };

    const handleCancelar = async (id) => {
        if (window.confirm('¿Estás seguro de cancelar esta factura? No se puede deshacer.')) {
            try {
                await facturasService.cambiarEstado(id, 'Cancelada');
                cargarFacturas();
            } catch (error) { alert(error.response?.data?.mensaje || 'Error al cancelar factura'); }
        }
    };

    const handleEliminar = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este borrador permanentemente?')) {
            try {
                await facturasService.eliminar(id);
                cargarFacturas();
            } catch (error) { alert(error.response?.data?.mensaje || 'No tienes permiso'); }
        }
    };

    // --- LÓGICA DE PAGOS ---
    const abrirModalPago = (factura) => {
        setFacturaAbono(factura);
        const saldoPendiente = parseFloat(factura.monto) - parseFloat(factura.total_pagado || 0);
        setDatosPago({ monto_pagado: saldoPendiente.toFixed(2), forma_pago: '03' }); // Sugerimos liquidar el saldo total por transferencia
        setIsPagoModalOpen(true);
    };

    const registrarPago = async (e) => {
        e.preventDefault();
        if (parseFloat(datosPago.monto_pagado) <= 0) return alert("El monto debe ser mayor a cero.");

        try {
            await facturasService.agregarPago(facturaAbono.id, datosPago);
            alert("¡Abono registrado con éxito!");
            setIsPagoModalOpen(false);
            cargarFacturas(); // Recargamos para que el saldo se actualice en la tabla
        } catch (error) {
            alert(error.response?.data?.mensaje || "Error al registrar el abono");
        }
    };

    const abrirDetalles = (factura) => { setFacturaSeleccionada(factura); setIsDetailOpen(true); };
    const abrirEdicion = (factura) => { navigate('/crear-factura', { state: { facturaEditando: factura } }); };

    return (
        <div className="dashboard-container">

            {/* SECCIÓN DE FILTROS */}
            <div className="dashboard-actions" style={{ justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '15px', borderRadius: '10px', marginBottom: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                <form onSubmit={handleBuscarPorRFC} style={{ display: 'flex', gap: '10px' }}>
                    <input type="text" placeholder="Buscar por RFC..." style={{ padding: '8px 15px', borderRadius: '8px', border: '1px solid #cbd5e1' }} value={busquedaRFC} onChange={(e) => setBusquedaRFC(e.target.value)} />
                    <button type="submit" className="btn-action btn-detalles" style={{ margin: 0 }}>Buscar</button>
                </form>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <select style={{ padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }} value={filtroEstado} onChange={(e) => { setFiltroEstado(e.target.value); setPaginaActual(1); }}>
                        <option value="Todas">Todos los Estados</option>
                        <option value="Borrador">Borradores</option>
                        <option value="Emitida">Emitidas</option>
                        <option value="Cancelada">Canceladas</option>
                    </select>

                    <button className="btn-new" onClick={() => navigate('/crear-factura')} style={{ margin: 0, padding: '10px 20px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                        + Nueva Factura
                    </button>
                </div>
            </div>

            <div className="table-container">
                {loading ? (
                    <div className="loading-state">Cargando registros...</div>
                ) : facturas.length === 0 ? (
                    <div className="empty-state">No se encontraron facturas con esos criterios.</div>
                ) : (
                    <>
                        <table className="facturas-table">
                            <thead>
                                <tr>
                                    <th>Folio</th>
                                    <th>RFC Cliente</th>
                                    <th>Monto Total</th>
                                    <th>Pagado / Saldo</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {facturas.map((factura) => {
                                    // Cálculos Financieros Rápidos
                                    const totalFactura = parseFloat(factura.monto);
                                    const totalPagado = parseFloat(factura.total_pagado || 0);
                                    const saldo = totalFactura - totalPagado;
                                    const esPPD = factura.metodoPago === 'PPD' || factura.metodo_pago === 'PPD';

                                    return (
                                        <tr key={factura.id}>
                                            <td><strong>#{factura.id}</strong></td>
                                            <td>{factura.rfcCliente}</td>
                                            <td><strong>${totalFactura.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></td>

                                            {/* COLUMNA DE SALDOS */}
                                            <td>
                                                {esPPD ? (
                                                    <div style={{ fontSize: '0.85rem' }}>
                                                        <span style={{ color: '#10b981', display: 'block' }}>Pagado: ${totalPagado.toLocaleString('es-MX')}</span>
                                                        <span style={{ color: saldo > 0 ? '#ef4444' : '#64748b', fontWeight: 'bold' }}>Saldo: ${saldo.toLocaleString('es-MX')}</span>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>PUE (Contado)</span>
                                                )}
                                            </td>

                                            <td><span className={`status-badge status-${(factura.estado || 'borrador').toLowerCase()}`}>{factura.estado}</span></td>

                                            <td>
                                                <button className="btn-action btn-detalles" onClick={() => abrirDetalles(factura)}>Ver</button>

                                                {/* BOTÓN ABONAR (Solo para PPD emitidas y con saldo > 0) */}
                                                {factura.estado === 'Emitida' && esPPD && saldo > 0 && (
                                                    <button className="btn-action" style={{ background: '#3b82f6', color: 'white' }} onClick={() => abrirModalPago(factura)}>
                                                        Abonar
                                                    </button>
                                                )}

                                                {user?.rol === 'user' && factura.estado === 'Borrador' && (
                                                    <button className="btn-action btn-emitir" onClick={() => handleEmitir(factura.id)}>Emitir</button>
                                                )}

                                                {user?.rol === 'admin' && (
                                                    <>
                                                        {factura.estado === 'Borrador' && (
                                                            <>
                                                                <button className="btn-action btn-emitir" onClick={() => handleEmitir(factura.id)}>Emitir</button>
                                                                <button className="btn-action btn-editar" onClick={() => abrirEdicion(factura)}>Editar</button>
                                                                <button className="btn-action btn-eliminar" onClick={() => handleEliminar(factura.id)}>Eliminar</button>
                                                            </>
                                                        )}
                                                        {factura.estado === 'Emitida' && (
                                                            <button className="btn-action btn-cancelar" onClick={() => handleCancelar(factura.id)}>Cancelar</button>
                                                        )}
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* CONTROLES DE PAGINACIÓN */}
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
                            <button disabled={paginaActual === 1} onClick={() => setPaginaActual(paginaActual - 1)} style={{ padding: '8px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: paginaActual === 1 ? 'not-allowed' : 'pointer' }}>Anterior</button>
                            <span style={{ color: '#475569', fontWeight: 'bold' }}>Página {paginaActual} de {totalPaginas}</span>
                            <button disabled={paginaActual === totalPaginas} onClick={() => setPaginaActual(paginaActual + 1)} style={{ padding: '8px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer' }}>Siguiente</button>
                        </div>
                    </>
                )}
            </div>

            <InvoiceDetailModal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} factura={facturaSeleccionada} />

            {/* MODAL DE PAGOS (COMPLEMENTO) */}
            {isPagoModalOpen && facturaAbono && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <h3 style={{ marginTop: 0, color: '#0f172a' }}>Registrar Abono</h3>
                        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Factura #{facturaAbono.id} - Saldo: ${(facturaAbono.monto - (facturaAbono.total_pagado || 0)).toLocaleString('es-MX', {minimumFractionDigits:2})}</p>

                        <form onSubmit={registrarPago}>
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label>Monto a Pagar ($)</label>
                                <input type="number" step="0.01" required value={datosPago.monto_pagado} onChange={e => setDatosPago({...datosPago, monto_pagado: e.target.value})} />
                            </div>
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label>Forma de Pago</label>
                                <select value={datosPago.forma_pago} onChange={e => setDatosPago({...datosPago, forma_pago: e.target.value})}>
                                    <option value="01">01 - Efectivo</option>
                                    <option value="02">02 - Cheque nominativo</option>
                                    <option value="03">03 - Transferencia electrónica</option>
                                    <option value="04">04 - Tarjeta de crédito</option>
                                    <option value="28">28 - Tarjeta de débito</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" className="btn-outline" onClick={() => setIsPagoModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary">Registrar Abono</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Dashboard;
