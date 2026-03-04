import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import facturasService from '../services/facturas.service';
import InvoiceModal from '../components/InvoiceModal';
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

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
    const [facturaEditando, setFacturaEditando] = useState(null);

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

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
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

    const abrirDetalles = (factura) => { setFacturaSeleccionada(factura); setIsDetailOpen(true); };
    const abrirEdicion = (factura) => { setFacturaEditando(factura); setIsModalOpen(true); };
    const abrirNuevaFactura = () => { setFacturaEditando(null); setIsModalOpen(true); };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="dashboard-title">
                    <h1>Gestión de Facturas</h1>
                    <p>Conectado como: <strong>{user?.email}</strong> <span className="role-badge">{user?.rol?.toUpperCase()}</span></p>
                </div>
                <button onClick={handleLogout} className="btn-logout">Cerrar Sesión</button>
            </header>

            {/* SECCIÓN DE FILTROS */}
            <div className="dashboard-actions" style={{ justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '15px', borderRadius: '10px', marginBottom: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>

                <form onSubmit={handleBuscarPorRFC} style={{ display: 'flex', gap: '10px' }}>
                    <input
                        type="text"
                        placeholder="Buscar por RFC..."
                        style={{ padding: '8px 15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        value={busquedaRFC}
                        onChange={(e) => setBusquedaRFC(e.target.value)}
                    />
                    <button type="submit" className="btn-action btn-detalles" style={{ margin: 0 }}>Buscar</button>
                </form>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <select
                        style={{ padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        value={filtroEstado}
                        onChange={(e) => { setFiltroEstado(e.target.value); setPaginaActual(1); }}
                    >
                        <option value="Todas">Todos los Estados</option>
                        <option value="Borrador">Borradores</option>
                        <option value="Emitida">Emitidas</option>
                        <option value="Cancelada">Canceladas</option>
                    </select>

                    <button className="btn-new" onClick={abrirNuevaFactura} style={{ margin: 0 }}>Nueva Factura</button>
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
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {facturas.map((factura) => (
                                    <tr key={factura.id}>
                                        <td><strong>#{factura.id}</strong></td>
                                        <td>{factura.rfcCliente}</td>
                                        <td><strong>${parseFloat(factura.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></td>
                                        <td><span className={`status-badge status-${factura.estado.toLowerCase()}`}>{factura.estado}</span></td>
                                        <td>
                                            <button className="btn-action btn-detalles" onClick={() => abrirDetalles(factura)}>Ver</button>

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
                                ))}
                            </tbody>
                        </table>

                        {/* CONTROLES DE PAGINACIÓN */}
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
                            <button
                                disabled={paginaActual === 1}
                                onClick={() => setPaginaActual(paginaActual - 1)}
                                style={{ padding: '8px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: paginaActual === 1 ? 'not-allowed' : 'pointer', background: paginaActual === 1 ? '#f1f5f9' : 'white' }}
                            >
                                Anterior
                            </button>
                            <span style={{ color: '#475569', fontWeight: 'bold' }}>
                                Página {paginaActual} de {totalPaginas}
                            </span>
                            <button
                                disabled={paginaActual === totalPaginas}
                                onClick={() => setPaginaActual(paginaActual + 1)}
                                style={{ padding: '8px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer', background: paginaActual === totalPaginas ? '#f1f5f9' : 'white' }}
                            >
                                Siguiente
                            </button>
                        </div>
                    </>
                )}
            </div>

            <InvoiceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onRefresh={cargarFacturas} facturaEditando={facturaEditando} />
            <InvoiceDetailModal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} factura={facturaSeleccionada} />
        </div>
    );
};

export default Dashboard;
