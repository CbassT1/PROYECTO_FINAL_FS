import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Inicio from './pages/Inicio';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import CrearFactura from './pages/CrearFactura';
import Equipo from './pages/Equipo';
import Empresa from './pages/Empresa';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rutas Protegidas dentro del Layout */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/inicio" replace />} />
            <Route path="inicio" element={<Inicio />} />
            <Route path="facturas" element={<Dashboard />} />

            {/* Vistas futuras vacías por ahora para que no rompa el menú */}
            <Route path="crear-factura" element={<CrearFactura />} />
            <Route path="equipo" element={<Equipo />} />
            <Route path="empresa" element={<Empresa />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
