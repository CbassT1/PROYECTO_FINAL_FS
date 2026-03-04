import { Navigate } from 'react-router-dom';
import authService from '../services/auth.service';

const ProtectedRoute = ({ children, roleRequired }) => {
    const token = localStorage.getItem('token');
    const user = authService.getCurrentUser();

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    if (roleRequired && user.rol !== roleRequired) {
        return <Navigate to="/dashboard" replace />;
    }


    return children;
};

export default ProtectedRoute;