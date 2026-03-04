import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/auth.service';
import './Auth.css';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            // Ya solo enviamos email y password
            await authService.register(email, password);
            alert('¡Usuario creado con éxito! Ahora puedes iniciar sesión.');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error al registrar usuario');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Crear Cuenta</h2>
                <p className="auth-subtitle">Regístrate en el sistema de facturación</p>

                {error && <div className="error-tag">{error}</div>}

                <form onSubmit={handleRegister}>
                    <div className="form-group">
                        <label>Correo Electrónico</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Contraseña</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>

                    {/* Eliminamos el select de roles por completo */}

                    <button type="submit" className="btn-auth">Registrarse</button>
                </form>

                <div className="auth-footer">
                    ¿Ya tienes cuenta? <Link to="/login" className="auth-link">Inicia sesión aquí</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
