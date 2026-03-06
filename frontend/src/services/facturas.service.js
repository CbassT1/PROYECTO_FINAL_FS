import api from './api';

const facturasService = {
    obtenerTodas: async (page = 1, limit = 5, estado = 'Todas', search = '') => {
        const response = await api.get('/facturas', {
            params: {
                page: page,
                limit: limit,
                estado: estado,
                search: search // <-- ¡Aquí está la magia!
            }
        });
        return response.data;
    },

    crear: async (datosFactura) => {
        const response = await api.post('/facturas', datosFactura);
        return response.data;
    },

    // Solo ADMIN
    actualizar: async (id, datosFactura) => {
        const response = await api.put(`/facturas/${id}`, datosFactura);
        return response.data;
    },

    // User
    cambiarEstado: async (id, estado) => {
            const response = await api.patch(`/facturas/${id}/estado`, { estado });
            return response.data;
    },

    // Solo ADMIN
    eliminar: async (id) => {
        const response = await api.delete(`/facturas/${id}`);
        return response.data;
    },

    agregarPago: async (id, datosPago) => {
            const response = await api.post(`/facturas/${id}/pagos`, datosPago);
            return response.data;
    }
};

export default facturasService;
