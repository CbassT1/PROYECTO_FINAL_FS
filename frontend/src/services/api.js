import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000/api'
});

// Interceptor de Peticiones (Inyecta el token)
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor de Respuestas (Detecta si el token ya caducó)
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            // El token expiró o es inválido: Limpiamos y expulsamos
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
