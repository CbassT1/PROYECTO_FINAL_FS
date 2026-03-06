import React from 'react';

const InvoiceDetailModal = ({ isOpen, onClose, factura }) => {
    if (!isOpen || !factura) return null;

    // Aseguramos que los conceptos sean un arreglo válido
    const conceptos = typeof factura.conceptos === 'string' ? JSON.parse(factura.conceptos) : (factura.conceptos || []);

    // Recalculamos totales por seguridad visual
    const subtotal = conceptos.reduce((acc, c) => acc + (parseFloat(c.importe) || 0), 0);
    const iva = subtotal * 0.16;
    const total = subtotal + iva;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '650px' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '15px' }}>
                    <h2 style={{ margin: 0, color: '#0f172a' }}>Detalle de Factura #{factura.id}</h2>
                    <span className={`status-badge status-${factura.estado.toLowerCase()}`}>{factura.estado}</span>
                </div>

                {/* TARJETA DE RESUMEN DEL CLIENTE Y COMPROBANTE */}
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', border: '1px solid #e2e8f0' }}>
                    <div>
                        <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: '#64748b' }}>Receptor</p>
                        <p style={{ margin: 0, fontWeight: 'bold', color: '#0f172a' }}>{factura.rfcCliente}</p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#475569' }}>{factura.razonSocialCliente}</p>
                    </div>
                    <div>
                        <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: '#64748b' }}>Datos de Pago</p>
                        <p style={{ margin: 0, fontWeight: 'bold', color: '#0f172a' }}>{factura.formaPago || 'No especificada'}</p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#475569' }}>{factura.metodoPago || 'No especificado'} - {factura.moneda}</p>
                    </div>
                </div>

                <h3 style={{ fontSize: '1rem', color: '#334155', margin: '0 0 10px 0' }}>Conceptos</h3>

                <div style={{ overflowX: 'auto' }}>
                    <table className="tabla-conceptos" style={{ width: '100%', marginBottom: '20px' }}>
                        <thead>
                            <tr>
                                <th>Descripción</th>
                                <th>Cant.</th>
                                <th>V. Unitario</th>
                                <th>Importe</th>
                            </tr>
                        </thead>
                        <tbody>
                            {conceptos.map((c, i) => (
                                <tr key={i}>
                                    <td>
                                        <div style={{ fontWeight: 'bold', color: '#0f172a' }}>
                                            {c.clave ? c.clave.split(' ')[0] : 'N/A'} - {c.tipo}
                                        </div>
                                        {c.descripcion && (
                                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                                                {c.descripcion}
                                            </div>
                                        )}
                                    </td>
                                    <td>{c.cantidad}</td>
                                    <td>${parseFloat(c.precioUnitario).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                    <td><strong>${parseFloat(c.importe).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* CAJA DE TOTALES */}
                <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '8px', textAlign: 'right', border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: '0 0 5px 0', color: '#64748b' }}>Subtotal: <strong>${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></p>
                    <p style={{ margin: '0 0 10px 0', color: '#64748b' }}>IVA (16%): <strong>${iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></p>
                    <h2 style={{ margin: 0, color: '#0ea5e9', borderTop: '2px dashed #cbd5e1', paddingTop: '10px' }}>Total: ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h2>
                </div>

                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                    <button className="btn-outline" onClick={onClose}>Cerrar Detalle</button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceDetailModal;
