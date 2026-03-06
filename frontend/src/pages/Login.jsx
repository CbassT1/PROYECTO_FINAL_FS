import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/auth.service';
import './Auth.css';

const Login = () => {
    const [rfc, setRfc] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // VALIDACIÓN ESTRICTA DEL RFC ANTES DE ENVIAR
        if (rfc.length < 12 || rfc.length > 13) {
            setError('El RFC de la empresa debe tener exactamente 12 o 13 caracteres.');
            return;
        }

        try {
            await authService.login(rfc, email, password);
            navigate('/inicio'); // CORRECCIÓN: Ahora apunta a la ruta correcta
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Credenciales inválidas');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">InvoTech</h2>
                <p className="auth-subtitle">Ingresa a tu entorno de trabajo</p>

                {error && <div className="error-tag">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>RFC de la Empresa</label>
                        <input
                            type="text"
                            placeholder="XAXX010101000"
                            value={rfc}
                            maxLength={13} // Bloquea en el HTML que escriban más de 13
                            onChange={(e) => setRfc(e.target.value.toUpperCase())}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Correo Electrónico</label>
                        <input type="email" placeholder="tu@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Contraseña</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn-auth">Entrar al Sistema</button>
                </form>

                <div className="auth-footer">
                    ¿Tu empresa es nueva? <Link to="/register" className="auth-link">Regístrala aquí</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
