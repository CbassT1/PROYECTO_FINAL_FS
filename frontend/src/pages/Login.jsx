import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/auth.service';
import './Auth.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await authService.login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Credenciales inválidas');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Bienvenido</h2>
                <p className="auth-subtitle">Ingresa tus credenciales para continuar</p>

                {error && <div className="error-tag">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Correo Electrónico</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Contraseña</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn-auth">Entrar al Sistema</button>
                </form>

                <div className="auth-footer">
                    ¿No tienes cuenta? <Link to="/register" className="auth-link">Regístrate aquí</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
