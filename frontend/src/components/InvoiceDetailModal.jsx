import './InvoiceModal.css';

const InvoiceDetailModal = ({ isOpen, onClose, factura }) => {
    if (!isOpen || !factura) return null;


    let detalles = {};
    try {
        detalles = JSON.parse(factura.descripcion);
    } catch (e) {

        detalles = { conceptos: [{ descripcion: factura.descripcion, cantidad: 1, valorUnitario: factura.monto }] };
    }

    const { conceptos = [], formaPago = 'No especificada', metodoPago = 'No especificado' } = detalles;

    // Cálculos
    const subtotal = conceptos.reduce((acc, item) => acc + (parseFloat(item.cantidad) * parseFloat(item.valorUnitario)), 0);
    const iva = subtotal * 0.16;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem' }}>
                    <h2 style={{ margin: 0, color: '#0f172a' }}>Detalle de Factura #{factura.id}</h2>
                    <span className={`status-badge status-${factura.estado.toLowerCase()}`}>{factura.estado}</span>
                </div>

                <div className="form-row" style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    <div>
                        <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: '#64748b' }}>RFC Cliente</p>
                        <strong style={{ color: '#0f172a' }}>{factura.rfcCliente}</strong>
                    </div>
                    <div>
                        <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: '#64748b' }}>Forma de Pago</p>
                        <strong style={{ color: '#0f172a' }}>{formaPago}</strong>
                    </div>
                    <div>
                        <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: '#64748b' }}>Método de Pago</p>
                        <strong style={{ color: '#0f172a' }}>{metodoPago}</strong>
                    </div>
                </div>

                <div className="conceptos-wrapper" style={{ padding: 0, border: 'none', background: 'transparent' }}>
                    <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>Conceptos</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                        <thead>
                            <tr style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.85rem', textAlign: 'left' }}>
                                <th style={{ padding: '10px' }}>Descripción</th>
                                <th style={{ padding: '10px' }}>Cant.</th>
                                <th style={{ padding: '10px' }}>V. Unitario</th>
                                <th style={{ padding: '10px' }}>Importe</th>
                            </tr>
                        </thead>
                        <tbody>
                            {conceptos.map((c, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '0.9rem' }}>
                                    <td style={{ padding: '10px', color: '#334155' }}>{c.descripcion}</td>
                                    <td style={{ padding: '10px' }}>{c.cantidad}</td>
                                    <td style={{ padding: '10px' }}>${parseFloat(c.valorUnitario).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                    <td style={{ padding: '10px', fontWeight: 'bold' }}>
                                        ${(parseFloat(c.cantidad) * parseFloat(c.valorUnitario)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="totals-section" style={{ marginTop: '1.5rem' }}>
                    <p>Subtotal: <strong>${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></p>
                    <p>IVA (16%): <strong>${iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></p>
                    <hr />
                    <h4 className="total-text">Total: ${parseFloat(factura.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h4>
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn-cancel" onClick={onClose}>Cerrar Detalle</button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceDetailModal;
