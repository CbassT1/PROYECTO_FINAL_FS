import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import './Layout.css';

const Layout = () => {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <div className="layout-container">
            {/* SUPER HEADER */}
            <header className="main-header">
                <div className="header-left">
                    <h1 className="app-logo">InvoTech</h1>
                </div>

                <div className="header-right">
                    <div className="user-info-box">
                        <div className="user-details">
                            <span className="user-name">{user.nombre}</span>
                            <span className="user-role">{user.rol === 'admin' ? 'Administrador' : 'Usuario Operativo'}</span>
                        </div>
                        <div className="company-badge">
                            {user.empresa_nombre}
                        </div>
                    </div>
                    <button onClick={handleLogout} className="btn-logout-small">Salir</button>
                </div>
            </header>

            {/* BARRA DE NAVEGACIÓN (SUBPÁGINAS) */}
            <nav className="main-nav">
                <NavLink to="/inicio" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Inicio</NavLink>
                <NavLink to="/facturas" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Facturas</NavLink>
                <NavLink to="/crear-factura" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>+ Nueva Factura</NavLink>
                <NavLink to="/equipo" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Equipo</NavLink>
                {user.rol === 'admin' && (
                    <NavLink to="/empresa" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Mi Empresa</NavLink>
                )}
            </nav>

            {/* CONTENEDOR DINÁMICO (Aquí se inyectan las subpáginas) */}
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
