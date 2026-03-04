import api from './api';

const facturasService = {
    obtenerTodas: async (page = 1, limit = 10, estado = 'Todas', rfc = '') => {
            let url = `/facturas?page=${page}&limit=${limit}`;
            if (estado !== 'Todas') url += `&estado=${estado}`;
            if (rfc) url += `&rfc=${rfc}`;

            const response = await api.get(url);
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
    cambiarEstado: async (id, nuevoEstado) => {
        const response = await api.patch(`/facturas/${id}/estado`, { nuevoEstado });
        return response.data;
    },

    // Solo ADMIN
    eliminar: async (id) => {
        const response = await api.delete(`/facturas/${id}`);
        return response.data;
    }
};

export default facturasService;
