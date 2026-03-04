import api from './api';

const authService = {
    // Conecta con exports.autenticarUsuario
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });

        // Tu backend devuelve { token, usuario: { email, rol } }
        if (response.data.token) {
            // Guardamos el token y los datos del usuario en el navegador
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
        }
        return response.data;
    },

    // Conecta con exports.registrarUsuario
    register: async (email, password) => {
        // Ya solo mandamos email y password
        const response = await api.post('/auth/register', { email, password });
        return response.data;
    },
    // Función extra para cerrar sesión limpiando el almacenamiento
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
    },

    // Función extra para saber qué usuario está logueado y su rol
    getCurrentUser: () => {
        const usuarioStr = localStorage.getItem('usuario');
        if (usuarioStr) {
            return JSON.parse(usuarioStr);
        }
        return null;
    }
};

export default authService;