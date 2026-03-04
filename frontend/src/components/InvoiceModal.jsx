import { useState, useEffect } from 'react';
import facturasService from '../services/facturas.service';
import './InvoiceModal.css';

const InvoiceModal = ({ isOpen, onClose, onRefresh, facturaEditando }) => {
    const estadoInicialConcepto = { descripcion: '', cantidad: 1, valorUnitario: '' };
    const [conceptos, setConceptos] = useState([{ ...estadoInicialConcepto }]);
    const [rfcCliente, setRfcCliente] = useState('');
    const [formaPago, setFormaPago] = useState('');
    const [metodoPago, setMetodoPago] = useState('');

    useEffect(() => {
        if (facturaEditando && isOpen) {
            setRfcCliente(facturaEditando.rfcCliente);

            let detalles = {};
            try {
                detalles = JSON.parse(facturaEditando.descripcion);
                setConceptos(detalles.conceptos || [{ ...estadoInicialConcepto }]);
                setFormaPago(detalles.formaPago || '');
                setMetodoPago(detalles.metodoPago || '');
            } catch (error) {

                setConceptos([{ descripcion: facturaEditando.descripcion, cantidad: 1, valorUnitario: facturaEditando.monto }]);
                setFormaPago('');
                setMetodoPago('');
            }
        } else if (!facturaEditando && isOpen) {
            resetearFormulario();
        }
    }, [facturaEditando, isOpen]);

    if (!isOpen) return null;

    const subtotal = conceptos.reduce((acc, item) => {
        const cant = parseFloat(item.cantidad) || 0;
        const val = parseFloat(item.valorUnitario) || 0;
        return acc + (cant * val);
    }, 0);
    const iva = subtotal * 0.16;
    const total = subtotal + iva;

    const agregarConcepto = () => setConceptos([...conceptos, { ...estadoInicialConcepto }]);

    const actualizarConcepto = (index, campo, valor) => {
        const nuevosConceptos = [...conceptos];
        nuevosConceptos[index][campo] = valor;
        setConceptos(nuevosConceptos);
    };

    const eliminarConcepto = (index) => {
        if (conceptos.length > 1) setConceptos(conceptos.filter((_, i) => i !== index));
    };

    const resetearFormulario = () => {
        setConceptos([{ ...estadoInicialConcepto }]);
        setRfcCliente('');
        setFormaPago('');
        setMetodoPago('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rfcCliente.length < 12 || rfcCliente.length > 13) {
            return alert('El RFC debe tener entre 12 y 13 caracteres');
        }

        const datosParaEnvio = {
            rfcCliente,
            monto: total,
            cantidad: conceptos.length,
            tipo: 'Servicio',
            descripcion: JSON.stringify({ conceptos, formaPago, metodoPago })
        };

        try {
            // NUEVO: Si existe facturaEditando hacemos PUT, si no hacemos POST
            if (facturaEditando) {
                await facturasService.actualizar(facturaEditando.id, datosParaEnvio);
            } else {
                await facturasService.crear(datosParaEnvio);
            }
            onRefresh();
            onClose();
        } catch (error) {
            alert("Error: " + (error.response?.data?.mensaje || "Operación fallida"));
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2 className="modal-title">{facturaEditando ? `Editar Factura #${facturaEditando.id}` : 'Registrar Nueva Factura'}</h2>
                <form onSubmit={handleSubmit}>

                    <div className="form-row">
                        <div className="form-section" style={{ gridColumn: 'span 2' }}>
                            <label>RFC Cliente (12-13 caracteres)</label>
                            <input
                                className="input-field" type="text" placeholder="Ej: XAXX010101000"
                                maxLength={13} value={rfcCliente}
                                onChange={(e) => setRfcCliente(e.target.value.toUpperCase())} required
                            />
                        </div>

                        <div className="form-section">
                            <label>Forma de Pago</label>
                            <select className="input-field" value={formaPago} onChange={(e) => setFormaPago(e.target.value)} required>
                                <option value="" disabled>Seleccione una opción...</option>
                                <option value="Efectivo">Efectivo</option>
                                <option value="Cheque nominativo">Cheque nominativo</option>
                                <option value="Transferencia electrónica">Transferencia electrónica de fondos</option>
                                <option value="Por definir">Por definir</option>
                            </select>
                        </div>
                        <div className="form-section">
                            <label>Método de Pago</label>
                            <select className="input-field" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} required>
                                <option value="" disabled>Seleccione una opción...</option>
                                <option value="PUE">Pago en una sola exhibición (PUE)</option>
                                <option value="PPD">Pago parcial o diferido (PPD)</option>
                            </select>
                        </div>
                    </div>

                    <div className="conceptos-wrapper">
                        <h3>Detalle de Conceptos</h3>

                        {conceptos.map((c, i) => (
                            <div key={i} className="concepto-row">
                                <textarea
                                    placeholder="Descripción del concepto..." className="input-field auto-textarea"
                                    rows="1" value={c.descripcion}
                                    onChange={(e) => {
                                        actualizarConcepto(i, 'descripcion', e.target.value);
                                        e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px';
                                    }} required
                                />
                                <input
                                    type="number" placeholder="Cant." className="input-field no-arrows"
                                    min="1" value={c.cantidad} onChange={(e) => actualizarConcepto(i, 'cantidad', e.target.value)} required
                                />
                                <div className="currency-input-wrapper">
                                    <span className="currency-symbol">$</span>
                                    <input
                                        type="number" step="0.01" placeholder="Valor unitario" className="input-field no-arrows"
                                        value={c.valorUnitario} onChange={(e) => actualizarConcepto(i, 'valorUnitario', e.target.value)} required
                                    />
                                </div>
                                <button type="button" className="btn-remove-concept" onClick={() => eliminarConcepto(i)} disabled={conceptos.length === 1}>X</button>
                            </div>
                        ))}

                        <button type="button" onClick={agregarConcepto} className="btn-add-concept">+ Agregar otro concepto</button>
                    </div>

                    <div className="totals-section">
                        <p>Subtotal: <strong>${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></p>
                        <p>IVA (16%): <strong>${iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></p>
                        <hr />
                        <h4 className="total-text">Total: ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h4>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-save">{facturaEditando ? 'Actualizar Factura' : 'Crear Factura'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InvoiceModal;
