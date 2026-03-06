import { useState, useEffect } from 'react';
import api from '../services/api';
import authService from '../services/auth.service';
import './Dashboard.css';

const Equipo = () => {
    const user = authService.getCurrentUser();
    const [miembros, setMiembros] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estados del Modal de Creación/Edición
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [usuarioEditando, setUsuarioEditando] = useState(null);
    const [formulario, setFormulario] = useState({ nombre_completo: '', email: '', password: '', puesto: '', rolSeleccionado: 'user' });

    // Estados del Modal de Detalles (Facturas del usuario)
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
    const [facturasUsuario, setFacturasUsuario] = useState([]);

    const cargarEquipo = async () => {
        try {
            const res = await api.get('/equipo');
            setMiembros(res.data);
        } catch (error) { console.error("Error al cargar equipo:", error); }
        finally { setLoading(false); }
    };

    useEffect(() => { cargarEquipo(); }, []);

    // --- MANEJO DE FORMULARIO (Crear y Editar) ---
    const abrirNuevo = () => {
        setUsuarioEditando(null);
        setFormulario({ nombre_completo: '', email: '', password: '', puesto: '', rolSeleccionado: 'user' });
        setIsModalOpen(true);
    };

    const abrirEdicion = (miembro) => {
        setUsuarioEditando(miembro);
        // Al editar no pedimos password, y bloqueamos el email
        setFormulario({ nombre_completo: miembro.nombre_completo, email: miembro.email, password: '', puesto: miembro.puesto || '', rolSeleccionado: miembro.rol });
        setIsModalOpen(true);
    };

    const manejarGuardar = async (e) => {
        e.preventDefault();
        try {
            if (usuarioEditando) {
                // EDITAR
                await api.put(`/equipo/${usuarioEditando.id}`, formulario);
                alert("¡Usuario actualizado con éxito!");
            } else {
                // CREAR
                await api.post('/auth/register', formulario);
                alert("¡Usuario registrado con éxito!");
            }
            setIsModalOpen(false);
            cargarEquipo();
        } catch (error) { alert(error.response?.data?.mensaje || "Error al procesar la solicitud"); }
    };

    const manejarEliminar = async (id) => {
        if (window.confirm("¿Estás seguro de que deseas eliminar permanentemente a este usuario y revocar su acceso?")) {
            try {
                await api.delete(`/equipo/${id}`);
                cargarEquipo();
            } catch (error) { alert(error.response?.data?.mensaje || "Error al eliminar"); }
        }
    };

    // --- HISTORIAL DE FACTURAS ---
    const abrirDetalles = async (miembro) => {
        setUsuarioSeleccionado(miembro);
        setIsDetailOpen(true);
        try {
            const res = await api.get(`/equipo/${miembro.id}/facturas`);
            setFacturasUsuario(res.data);
        } catch (error) { console.error(error); }
    };

    return (
        <div className="dashboard-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#0f172a', margin: 0 }}>Mi Equipo de Trabajo</h2>
                {user?.rol === 'admin' && (
                    <button className="btn-success" onClick={abrirNuevo}>+ Agregar Miembro</button>
                )}
            </div>

            <div className="table-container">
                {loading ? <div className="loading-state">Cargando equipo...</div> : (
                    <table className="facturas-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Correo Electrónico</th>
                                <th>Puesto</th>
                                <th>Nivel de Acceso</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {miembros.map((miembro) => (
                                <tr key={miembro.id}>
                                    <td><strong>{miembro.nombre_completo}</strong> {miembro.id === user.id && <span style={{fontSize:'0.75rem', color:'#0ea5e9', marginLeft:'5px'}}>(Tú)</span>}</td>
                                    <td>{miembro.email}</td>
                                    <td>{miembro.puesto || 'No especificado'}</td>
                                    <td>
                                        <span className={`status-badge ${miembro.rol === 'admin' ? 'status-emitida' : 'status-borrador'}`}>
                                            {miembro.rol === 'admin' ? 'Administrador' : 'Usuario Operativo'}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="btn-action btn-detalles" onClick={() => abrirDetalles(miembro)}>Auditar</button>

                                        {/* Solo el Admin puede editar/eliminar, y no puede eliminarse a sí mismo aquí */}
                                        {user?.rol === 'admin' && (
                                            <>
                                                <button className="btn-action btn-editar" onClick={() => abrirEdicion(miembro)}>Editar</button>
                                                {miembro.id !== user.id && (
                                                    <button className="btn-action btn-eliminar" onClick={() => manejarEliminar(miembro.id)}>Eliminar</button>
                                                )}
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* MODAL: REGISTRAR / EDITAR MIEMBRO */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <h3 style={{ marginTop: 0, color: '#0f172a' }}>{usuarioEditando ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}</h3>
                        <form onSubmit={manejarGuardar}>
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label>Nombre Completo</label>
                                <input type="text" required value={formulario.nombre_completo} onChange={e => setFormulario({...formulario, nombre_completo: e.target.value})} />
                            </div>
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label>Correo Electrónico</label>
                                <input type="email" required disabled={!!usuarioEditando} value={formulario.email} onChange={e => setFormulario({...formulario, email: e.target.value})} />
                            </div>

                            {!usuarioEditando && (
                                <div className="form-group" style={{ marginBottom: '15px' }}>
                                    <label>Contraseña Temporal</label>
                                    <input type="password" required value={formulario.password} onChange={e => setFormulario({...formulario, password: e.target.value})} />
                                </div>
                            )}

                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label>Puesto (Opcional)</label>
                                <input type="text" placeholder="Ej: Vendedor, Contador..." value={formulario.puesto} onChange={e => setFormulario({...formulario, puesto: e.target.value})} />
                            </div>
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label>Rol en el sistema</label>
                                <select value={formulario.rolSeleccionado} onChange={e => setFormulario({...formulario, rolSeleccionado: e.target.value})}>
                                    <option value="user">Usuario Operativo</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary">{usuarioEditando ? 'Actualizar' : 'Registrar'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: AUDITORÍA DE FACTURAS */}
            {isDetailOpen && usuarioSeleccionado && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <h3 style={{ marginTop: 0, color: '#0f172a' }}>Actividad de {usuarioSeleccionado.nombre_completo}</h3>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '15px' }}>Historial de documentos elaborados por este usuario.</p>

                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {facturasUsuario.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>No ha elaborado ninguna factura aún.</p>
                            ) : (
                                <table className="tabla-conceptos">
                                    <thead>
                                        <tr>
                                            <th>Folio</th>
                                            <th>Cliente (RFC)</th>
                                            <th>Monto</th>
                                            <th>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {facturasUsuario.map(f => (
                                            <tr key={f.id}>
                                                <td><strong>#{f.id}</strong></td>
                                                <td>{f.rfcCliente}</td>
                                                <td>${parseFloat(f.monto).toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
                                                <td><span className={`status-badge status-${f.estado.toLowerCase()}`}>{f.estado}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div style={{ marginTop: '20px', textAlign: 'right' }}>
                            <button className="btn-outline" onClick={() => setIsDetailOpen(false)}>Cerrar Panel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Equipo;
