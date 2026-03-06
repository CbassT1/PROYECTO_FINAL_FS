import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/auth.service';
import './Auth.css';

const Login = () => {
    const [rfc, setRfc] = useState(''); // NUEVO ESTADO
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            // Pasamos el RFC al servicio
            await authService.login(rfc, email, password);
            navigate('/dashboard');
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
                        <input type="text" placeholder="XAXX010101000" value={rfc} onChange={(e) => setRfc(e.target.value.toUpperCase())} required />
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
