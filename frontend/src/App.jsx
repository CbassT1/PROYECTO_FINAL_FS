import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard'; // Tu pantalla actual de gestión
import Inicio from './pages/Inicio'; // La nueva gráfica
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout'; // NUEVO

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
            <Route path="crear-factura" element={<h2 style={{textAlign: 'center', marginTop:'50px'}}>Próximamente: Motor de Facturación</h2>} />
            <Route path="equipo" element={<h2 style={{textAlign: 'center', marginTop:'50px'}}>Próximamente: Gestión de Equipo</h2>} />
            <Route path="empresa" element={<h2 style={{textAlign: 'center', marginTop:'50px'}}>Próximamente: Configuración de Empresa</h2>} />
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
