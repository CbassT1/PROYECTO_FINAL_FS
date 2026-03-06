import api from './api';
import axios from 'axios'; // <-- NUEVA IMPORTACIÓN

const authService = {
    login: async (rfc, email, password) => {
        const response = await api.post('/auth/login', { rfc, email, password });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.usuario));
        }
        return response.data;
    },

    registerEmpresa: async (rfc, nombre, password) => {
        const response = await api.post('/auth/empresa/register', { rfc, nombre, password });
        return response.data;
    },

    registerUsuario: async (datosUsuario, tokenTemporal) => {
        // USAMOS AXIOS PURO PARA EVITAR QUE EL INTERCEPTOR APLASTE NUESTRO TOKEN
        const response = await axios.post('http://localhost:3000/api/auth/register', datosUsuario, {
            headers: { Authorization: `Bearer ${tokenTemporal}` }
        });
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getCurrentUser: () => JSON.parse(localStorage.getItem('user')),
    getToken: () => localStorage.getItem('token')
};

export default authService;
