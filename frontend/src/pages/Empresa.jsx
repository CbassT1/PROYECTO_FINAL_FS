import { useState, useEffect } from 'react';
import api from '../services/api';
import authService from '../services/auth.service';
import './Dashboard.css';

const Empresa = () => {
    const user = authService.getCurrentUser();
    const [loading, setLoading] = useState(true);

    // Datos Generales
    const [formulario, setFormulario] = useState({ rfc: '', nombre: '', password: '' });
    const [mostrarPassword, setMostrarPassword] = useState(false); // Controlador del ojito

    // Datos de los Sellos (CSD)
    const [archivosCSD, setArchivosCSD] = useState({ cer: null, key: null, passwordKey: '' });
    const [mostrarPasswordKey, setMostrarPasswordKey] = useState(false);

    useEffect(() => {
        const cargarDatosEmpresa = async () => {
            try {
                const res = await api.get('/empresa');
                setFormulario({
                    rfc: res.data.rfc || '',
                    nombre: res.data.nombre || '',
                    password: ''
                });
            } catch (error) {
                console.error("Error al cargar la empresa:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user?.rol === 'admin') {
            cargarDatosEmpresa();
        }
    }, []);

    const manejarGuardar = async (e) => {
        e.preventDefault();
        try {

            await api.put('/empresa', {
                nombre: formulario.nombre,
                password: formulario.password
            });

            alert("¡Datos de la empresa actualizados exitosamente!");
            setFormulario({ ...formulario, password: '' });

            if (archivosCSD.cer || archivosCSD.key) {
                alert("La carga de archivos CSD se conectará en el siguiente paso con el Backend.");
            }

        } catch (error) {
            alert(error.response?.data?.mensaje || "Error al actualizar la empresa");
        }
    };

    if (user?.rol !== 'admin') {
        return <div className="dashboard-container"><h2>Acceso Denegado</h2><p>Solo los administradores pueden ver esta página.</p></div>;
    }

    return (
        <div className="dashboard-container">
            <h2 style={{ color: '#0f172a', marginBottom: '20px' }}>Configuración de la Empresa</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>

                {/* TARJETA 1: DATOS GENERALES */}
                <div className="table-container" style={{ padding: '25px', margin: 0 }}>
                    <h3 style={{ marginTop: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>Datos Generales</h3>
                    {loading ? <p>Cargando datos...</p> : (
                        <form id="form-empresa" onSubmit={manejarGuardar}>
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label>RFC de la Empresa (No modificable)</label>
                                <input
                                    type="text"
                                    value={formulario.rfc}
                                    disabled
                                    style={{ backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'not-allowed', fontWeight: 'bold' }}
                                />
                                <small style={{ color: '#94a3b8', marginTop: '5px', display: 'block' }}>
                                    El RFC es tu identificador fiscal. Para cambiarlo, debes registrar una nueva empresa.
                                </small>
                            </div>

                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label>Razón Social o Nombre Comercial</label>
                                <input
                                    type="text"
                                    required
                                    value={formulario.nombre}
                                    onChange={e => setFormulario({...formulario, nombre: e.target.value})}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label>Nueva Contraseña (Opcional)</label>
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    <input
                                        type={mostrarPassword ? "text" : "password"}
                                        placeholder="Déjalo en blanco para mantener la actual"
                                        value={formulario.password}
                                        onChange={e => setFormulario({...formulario, password: e.target.value})}
                                        style={{ width: '100%', paddingRight: '70px' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setMostrarPassword(!mostrarPassword)}
                                        style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: '#0ea5e9', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
                                    >
                                        {mostrarPassword ? 'OCULTAR' : 'VER'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                {/* TARJETA 2: SELLOS DIGITALES (CSD) */}
                <div className="table-container" style={{ padding: '25px', margin: 0, backgroundColor: '#f8fafc' }}>
                    <h3 style={{ marginTop: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', color: '#0f172a' }}>
                        Certificados de Sello Digital (CSD)
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>
                        Estos archivos son obligatorios para poder timbrar tus facturas ante el SAT.
                    </p>

                    <div className="form-group" style={{ marginBottom: '15px' }}>
                        <label>Archivo Certificado (.cer)</label>
                        <input
                            type="file"
                            accept=".cer"
                            onChange={e => setArchivosCSD({...archivosCSD, cer: e.target.files[0]})}
                            style={{ padding: '5px', background: 'white' }}
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '15px' }}>
                        <label>Archivo Llave Privada (.key)</label>
                        <input
                            type="file"
                            accept=".key"
                            onChange={e => setArchivosCSD({...archivosCSD, key: e.target.files[0]})}
                            style={{ padding: '5px', background: 'white' }}
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label>Contraseña de la Llave Privada</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input
                                type={mostrarPasswordKey ? "text" : "password"}
                                placeholder="Contraseña de tus sellos"
                                value={archivosCSD.passwordKey}
                                onChange={e => setArchivosCSD({...archivosCSD, passwordKey: e.target.value})}
                                style={{ width: '100%', paddingRight: '70px', background: 'white' }}
                            />
                            <button
                                type="button"
                                onClick={() => setMostrarPasswordKey(!mostrarPasswordKey)}
                                style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: '#0ea5e9', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
                            >
                                {mostrarPasswordKey ? 'OCULTAR' : 'VER'}
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* BOTÓN MAESTRO PARA GUARDAR TODO */}
            <div style={{ textAlign: 'right', marginTop: '20px' }}>
                <button type="submit" form="form-empresa" className="btn-success">
                    Guardar Configuración
                </button>
            </div>
        </div>
    );
};

export default Empresa;
