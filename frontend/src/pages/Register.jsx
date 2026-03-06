import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/auth.service';
import './Auth.css';

const Register = () => {
    const [paso, setPaso] = useState(1); // Controla si mostramos el paso 1 o 2
    const [tokenEmpresa, setTokenEmpresa] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Estado para guardar los datos del Paso 1
    const [datosEmpresa, setDatosEmpresa] = useState({ rfc: '', nombre: '', password: '' });

    // Estado para guardar los datos del Paso 2
    const [datosUsuario, setDatosUsuario] = useState({ email: '', nombre_completo: '', puesto: '', password: '' });

    // Enviar Paso 1
    const handleRegistroEmpresa = async (e) => {
        e.preventDefault();
        try {
            const res = await authService.registerEmpresa(datosEmpresa.rfc, datosEmpresa.nombre, datosEmpresa.password);
            setTokenEmpresa(res.tokenEmpresa); // Guardamos el token mágico que nos dio el backend
            setError('');
            setPaso(2); // Avanzamos a la siguiente pantalla
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error al registrar la empresa');
        }
    };

    // Enviar Paso 2
    const handleRegistroUsuario = async (e) => {
        e.preventDefault();
        try {
            // Mandamos los datos y el token de la empresa
            await authService.registerUsuario(datosUsuario, tokenEmpresa);
            alert('¡Empresa y Administrador creados con éxito! Ahora puedes iniciar sesión.');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error al crear el usuario administrador');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ maxWidth: '550px' }}>
                <h2 className="auth-title">Crear Cuenta en InvoTech</h2>
                <p className="auth-subtitle">
                    {paso === 1 ? 'Paso 1: Da de alta a tu organización' : 'Paso 2: Crea tu usuario Administrador'}
                </p>

                {error && <div className="error-tag">{error}</div>}

                {/* FORMULARIO 1: EMPRESA */}
                {paso === 1 && (
                    <form onSubmit={handleRegistroEmpresa}>
                        <div className="form-group">
                            <label>RFC de la Empresa (12-13 caracteres)</label>
                            <input type="text" placeholder="Ej: XAXX010101000" value={datosEmpresa.rfc} onChange={(e) => setDatosEmpresa({...datosEmpresa, rfc: e.target.value.toUpperCase()})} maxLength="13" required />
                        </div>
                        <div className="form-group">
                            <label>Razón Social / Nombre Comercial</label>
                            <input type="text" placeholder="Ej: Consultores Tiksa SA de CV" value={datosEmpresa.nombre} onChange={(e) => setDatosEmpresa({...datosEmpresa, nombre: e.target.value})} required />
                        </div>
                        <div className="form-group">
                            <label>Contraseña Maestra de Empresa</label>
                            <input type="password" value={datosEmpresa.password} onChange={(e) => setDatosEmpresa({...datosEmpresa, password: e.target.value})} required />
                        </div>

                        {/* NUEVOS CAMPOS DE ARCHIVO (OPCIONALES PARA LA DEMO) */}
                        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px dashed #cbd5e1' }}>
                            <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#475569', fontWeight: 'bold' }}>Sellos Digitales (CSD) - Opcional para Demo</p>
                            <div className="form-group" style={{ marginBottom: '10px' }}>
                                <label style={{ fontSize: '0.8rem' }}>Certificado (.cer)</label>
                                <input type="file" accept=".cer" style={{ border: 'none', padding: 0 }} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.8rem' }}>Llave Privada (.key)</label>
                                <input type="file" accept=".key" style={{ border: 'none', padding: 0 }} />
                            </div>
                        </div>

                        <button type="submit" className="btn-auth">Continuar al Paso 2</button>
                    </form>
                )}

                {/* FORMULARIO 2: USUARIO */}
                {paso === 2 && (
                    <form onSubmit={handleRegistroUsuario}>
                        <div className="form-group">
                            <label>Nombre Completo</label>
                            <input type="text" placeholder="Ej: Juan Pérez" value={datosUsuario.nombre_completo} onChange={(e) => setDatosUsuario({...datosUsuario, nombre_completo: e.target.value})} required />
                        </div>
                        <div className="form-group">
                            <label>Correo Electrónico Laboral</label>
                            <input type="email" placeholder="juan@empresa.com" value={datosUsuario.email} onChange={(e) => setDatosUsuario({...datosUsuario, email: e.target.value})} required />
                        </div>
                        <div className="form-group">
                            <label>Puesto</label>
                            <input type="text" placeholder="Ej: Director General / Finanzas" value={datosUsuario.puesto} onChange={(e) => setDatosUsuario({...datosUsuario, puesto: e.target.value})} required />
                        </div>
                        <div className="form-group">
                            <label>Contraseña Personal</label>
                            <input type="password" value={datosUsuario.password} onChange={(e) => setDatosUsuario({...datosUsuario, password: e.target.value})} required />
                        </div>
                        <button type="submit" className="btn-auth">Finalizar Registro</button>
                    </form>
                )}

                <div className="auth-footer">
                    ¿Ya tienes cuenta? <Link to="/login" className="auth-link">Inicia sesión aquí</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
