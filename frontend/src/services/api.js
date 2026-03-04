import axios from 'axios';

// Creamos una instancia de axios apuntando a tu backend
const api = axios.create({
    baseURL: 'http://localhost:3000/api'
});

// Interceptor: Antes de que salga cualquier petición, haz lo siguiente:
api.interceptors.request.use(
    (config) => {
        // Buscamos el token en el almacenamiento del navegador
        const token = localStorage.getItem('token');
        if (token) {
            // Si hay token, se lo inyectamos a los headers
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;