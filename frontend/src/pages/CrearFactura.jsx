import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './CrearFactura.css';

const CrearFactura = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // NUEVO: Atrapamos la factura si venimos desde el botón "Editar" del Dashboard
    const facturaEditando = location.state?.facturaEditando;

    // ESTADOS: Modal de Nuevo Cliente
    const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
    const [nuevoCliente, setNuevoCliente] = useState({ rfc: '', razonSocial: '', regimenFiscal: '', direccion: '' });

    // ESTADOS: Sección 1 - Receptor
    const [cliente, setCliente] = useState({ rfc: '', razonSocial: '', regimenFiscal: '', usoCFDI: '' });
    const [sugerenciasClientes, setSugerenciasClientes] = useState([]);

    // ESTADOS: Sección 2 y 3
    const [comprobante, setComprobante] = useState({ moneda: '', metodoPago: '', formaPago: '' });
    const conceptoVacio = { clave: '', tipo: '', unidad: '', cantidad: 1, precioUnitario: '', descuento: '', descripcion: '', objetoImpuesto: '02' };
    const [conceptoActual, setConceptoActual] = useState(conceptoVacio);
    const [listaConceptos, setListaConceptos] = useState([]);

    // ESTADOS: Buscadores SAT
    const [sugerenciasClaves, setSugerenciasClaves] = useState([]);
    const [sugerenciasUnidades, setSugerenciasUnidades] = useState([]);

    // REFERENCIAS
    const textareaRef = useRef(null);
    const timerBusqueda = useRef(null);
    const timerCliente = useRef(null);

    const importeActual = (parseFloat(conceptoActual.cantidad) || 0) * (parseFloat(conceptoActual.precioUnitario) || 0);

    // NUEVO: EFECTO PARA AUTORELLENAR LA FACTURA SI ESTAMOS EN MODO EDICIÓN
    useEffect(() => {
        if (facturaEditando) {
            setCliente({
                rfc: facturaEditando.rfcCliente || '',
                razonSocial: facturaEditando.razonSocialCliente || '',
                regimenFiscal: '',
                usoCFDI: ''
            });
            setComprobante({
                moneda: facturaEditando.moneda || 'MXN',
                metodoPago: facturaEditando.metodoPago || '',
                formaPago: facturaEditando.formaPago || ''
            });

            const conceptosList = typeof facturaEditando.conceptos === 'string'
                ? JSON.parse(facturaEditando.conceptos)
                : (facturaEditando.conceptos || []);

            setListaConceptos(conceptosList);
        }
    }, [facturaEditando]);


    // --- FUNCIONES DE CLIENTES ---
    const guardarNuevoCliente = async () => {
        if(nuevoCliente.rfc.length < 12) return alert("El RFC debe tener al menos 12 caracteres");
        if(!nuevoCliente.razonSocial || !nuevoCliente.regimenFiscal) return alert("Faltan datos obligatorios");

        try {
            await api.post('/facturas/clientes', {
                rfc: nuevoCliente.rfc,
                razonSocial: nuevoCliente.razonSocial,
                regimenFiscal: nuevoCliente.regimenFiscal,
                direccion: nuevoCliente.direccion
            });

            alert("¡Cliente guardado en la base de datos!");

            setCliente({ rfc: nuevoCliente.rfc, razonSocial: nuevoCliente.razonSocial, regimenFiscal: nuevoCliente.regimenFiscal, usoCFDI: '' });
            setIsClienteModalOpen(false);
        } catch (error) {
            alert(error.response?.data?.mensaje || "Error al guardar cliente");
        }
    };

    const manejarBuscadorRFC = (e) => {
        const valor = e.target.value.toUpperCase();
        setCliente({ ...cliente, rfc: valor, razonSocial: '', regimenFiscal: '', usoCFDI: '' });

        if (timerCliente.current) clearTimeout(timerCliente.current);

        if (valor.length >= 2) {

            timerCliente.current = setTimeout(async () => {
                try {
                    const res = await api.get(`/facturas/clientes/buscar?q=${valor}`);
                    setSugerenciasClientes(res.data);
                } catch (error) { console.error("Error buscando clientes:", error); }
            }, 300);
        } else {
            setSugerenciasClientes([]);
        }
    };

    const seleccionarCliente = (c) => {
        setCliente({ rfc: c.rfc, razonSocial: c.razonSocial, regimenFiscal: c.regimenFiscal, usoCFDI: '' });
        setSugerenciasClientes([]);
    };


    // --- FUNCIONES: BUSCADORES DEL SAT ---
    const manejarCambioClave = (e) => {
        const valor = e.target.value;
        setConceptoActual({ ...conceptoActual, clave: valor });

        if (timerBusqueda.current) clearTimeout(timerBusqueda.current);

        if (valor.length >= 3) {
            timerBusqueda.current = setTimeout(async () => {
                try {
                    const res = await api.get(`/catalogos/claves?q=${valor}`);
                    setSugerenciasClaves(res.data);
                } catch (error) { console.error("Error buscando claves:", error); }
            }, 300);
        } else {
            setSugerenciasClaves([]);
        }
    };

    const seleccionarClave = (item) => {
        setConceptoActual({ ...conceptoActual, clave: `${item.clave} - ${item.descripcion}` });
        setSugerenciasClaves([]);
    };

    const manejarCambioUnidad = (e) => {
        const valor = e.target.value;
        setConceptoActual({ ...conceptoActual, unidad: valor });

        if (timerBusqueda.current) clearTimeout(timerBusqueda.current);

        if (valor.length >= 2) {
            timerBusqueda.current = setTimeout(async () => {
                try {
                    const res = await api.get(`/catalogos/unidades?q=${valor}`);
                    setSugerenciasUnidades(res.data);
                } catch (error) { console.error("Error buscando unidades:", error); }
            }, 300);
        } else {
            setSugerenciasUnidades([]);
        }
    };

    const seleccionarUnidad = (item) => {
        setConceptoActual({ ...conceptoActual, unidad: `${item.clave} - ${item.nombre}` });
        setSugerenciasUnidades([]);
    };


    // --- FUNCIONES DE CONCEPTOS ---
    const manejarAgregarConcepto = () => {
        if (!conceptoActual.clave || !conceptoActual.precioUnitario || !conceptoActual.tipo) {
            return alert("Faltan datos en el concepto (Clave, Tipo o Precio)");
        }
        setListaConceptos([...listaConceptos, { ...conceptoActual, importe: importeActual }]);
        setConceptoActual(conceptoVacio);
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

    const eliminarConcepto = (index) => setListaConceptos(listaConceptos.filter((_, i) => i !== index));

    const editarConcepto = (index) => {
        setConceptoActual(listaConceptos[index]);
        eliminarConcepto(index);
    };

    const autoResizeTextarea = (e) => {
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
        setConceptoActual({...conceptoActual, descripcion: e.target.value});
    };

    const subtotal = listaConceptos.reduce((acc, c) => acc + c.importe, 0);
    const iva = subtotal * 0.16;
    const total = subtotal + iva;

    // NUEVO: LA FUNCIÓN DE GUARDAR AHORA SABE SI ESTAMOS EDITANDO O CREANDO
    const enviarBorrador = async () => {
        if (!cliente.rfc) return alert("Debes seleccionar un cliente");
        if (listaConceptos.length === 0) return alert("Debes agregar al menos un concepto");
        if (!comprobante.moneda || !comprobante.metodoPago || !comprobante.formaPago) return alert("Faltan datos del comprobante");

        const payload = {
            cliente_rfc: cliente.rfc,
            moneda: comprobante.moneda,
            metodoPago: comprobante.metodoPago,
            formaPago: comprobante.formaPago,
            monto: total,
            conceptos: listaConceptos
        };

        try {
            if (facturaEditando) {
                // Si es edición, usamos PUT a la ruta con el ID de la factura
                await api.put(`/facturas/${facturaEditando.id}`, payload);
                alert("¡Borrador actualizado exitosamente!");
            } else {
                // Si es nueva, usamos POST
                await api.post('/facturas', payload);
                alert("¡Borrador guardado exitosamente en la Base de Datos!");
            }
            // Después de guardar/editar, regresamos al Dashboard de facturas
            navigate('/facturas');
        } catch (error) {
            alert(error.response?.data?.mensaje || "Error al guardar el borrador");
        }
    };

    return (
        <div className="factura-container">
            <h2 className="page-title">{facturaEditando ? `Editar Borrador #${facturaEditando.id}` : 'Nueva Factura (CFDI 4.0)'}</h2>

            {/* MODAL: NUEVO CLIENTE */}
            {isClienteModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Alta de Nuevo Cliente</h3>
                        <div className="form-group">
                            <label>RFC (12 a 13 caracteres)</label>
                            <input type="text" value={nuevoCliente.rfc} onChange={e => setNuevoCliente({...nuevoCliente, rfc: e.target.value.toUpperCase()})} maxLength={13} minLength={12} placeholder="Ej: XAXX010101000" />
                        </div>
                        <div className="form-group">
                            <label>Razón Social</label>
                            <input type="text" value={nuevoCliente.razonSocial} onChange={e => setNuevoCliente({...nuevoCliente, razonSocial: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label>Régimen Fiscal</label>
                            <select value={nuevoCliente.regimenFiscal} onChange={e => setNuevoCliente({...nuevoCliente, regimenFiscal: e.target.value})}>
                                <option value="" disabled>Selecciona una opción</option>
                                <option value="601">601 - General de Ley Personas Morales</option>
                                <option value="605">605 - Sueldos y Salarios</option>
                                <option value="612">612 - Personas Físicas con Actividades Empresariales</option>
                                <option value="616">616 - Sin obligaciones fiscales</option>
                                <option value="626">626 - RESICO</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Dirección (Código Postal)</label>
                            <input type="text" value={nuevoCliente.direccion} onChange={e => setNuevoCliente({...nuevoCliente, direccion: e.target.value})} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <button className="btn-outline" onClick={() => setIsClienteModalOpen(false)}>Cancelar</button>
                            <button className="btn-primary" onClick={guardarNuevoCliente}>Guardar Cliente</button>
                        </div>
                    </div>
                </div>
            )}

            {/* SECCIÓN 1: RECEPTOR */}
            <div className="seccion-card">
                <div className="seccion-header">
                    <h3>Receptor</h3>
                    <button className="btn-outline" onClick={() => setIsClienteModalOpen(true)}>+ Agregar Cliente</button>
                </div>
                <div className="grid-2-col">

                    <div className="form-group" style={{ position: 'relative' }}>
                        <label>RFC (Buscador instantáneo) <span className="req">*</span></label>
                        <input type="text" placeholder="Empieza a escribir el RFC..." value={cliente.rfc} onChange={manejarBuscadorRFC} maxLength={13} minLength={12} />
                        {sugerenciasClientes.length > 0 && (
                            <ul className="custom-dropdown">
                                {sugerenciasClientes.map(c => (
                                    <li key={c.rfc} onClick={() => seleccionarCliente(c)}>
                                        <strong>{c.rfc}</strong> - {c.razonSocial}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Nombre o Razón Social <span className="req">*</span></label>
                        <input type="text" placeholder="Razón Social" value={cliente.razonSocial} onChange={e => setCliente({...cliente, razonSocial: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label>Régimen Fiscal <span className="req">*</span></label>
                        <select value={cliente.regimenFiscal} onChange={e => setCliente({...cliente, regimenFiscal: e.target.value})}>
                            <option value="" disabled>Selecciona una opción</option>
                            <option value="601">601 - General de Ley Personas Morales</option>
                            <option value="605">605 - Sueldos y Salarios</option>
                            <option value="612">612 - Personas Físicas con Actividades Empresariales</option>
                            <option value="616">616 - Sin obligaciones fiscales</option>
                            <option value="626">626 - RESICO</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Uso de CFDI <span className="req">*</span></label>
                        <select value={cliente.usoCFDI} onChange={e => setCliente({...cliente, usoCFDI: e.target.value})}>
                            <option value="" disabled>Selecciona una opción</option>
                            <option value="G01">G01 - Adquisición de mercancias</option>
                            <option value="G03">G03 - Gastos en general</option>
                            <option value="S01">S01 - Sin efectos fiscales</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: COMPROBANTE */}
            <div className="seccion-card">
                <h3>Datos del Comprobante</h3>
                <div className="grid-3-col">
                    <div className="form-group">
                        <label>Moneda <span className="req">*</span></label>
                        <select value={comprobante.moneda} onChange={e => setComprobante({...comprobante, moneda: e.target.value})}>
                            <option value="" disabled>Selecciona una opción</option>
                            <option value="MXN">MXN - Peso Mexicano</option>
                            <option value="USD">USD - Dólar Estadounidense</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Método de Pago <span className="req">*</span></label>
                        <select value={comprobante.metodoPago} onChange={e => setComprobante({...comprobante, metodoPago: e.target.value})}>
                            <option value="" disabled>Selecciona una opción</option>
                            <option value="PUE">PUE - Pago en una sola exhibición</option>
                            <option value="PPD">PPD - Pago en parcialidades o diferido</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Forma de Pago <span className="req">*</span></label>
                        <select value={comprobante.formaPago} onChange={e => setComprobante({...comprobante, formaPago: e.target.value})}>
                            <option value="" disabled>Selecciona una opción</option>
                            <option value="01">01 - Efectivo</option>
                            <option value="02">02 - Cheque nominativo</option>
                            <option value="03">03 - Transferencia electrónica</option>
                            <option value="99">99 - Por definir</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 3: AGREGAR CONCEPTO */}
            <div className="seccion-card bg-gray">
                <h3>Agregar Concepto al CFDI</h3>
                <div className="grid-3-col" style={{ alignItems: 'end' }}>

                    {/* BUSCADOR REAL: CLAVE SAT */}
                    <div className="form-group" style={{ position: 'relative' }}>
                        <label>Clave Producto/Servicio (SAT)</label>
                        <input type="text" placeholder="Escribe para buscar en SAT..." value={conceptoActual.clave} onChange={manejarCambioClave} />
                        {sugerenciasClaves.length > 0 && (
                            <ul className="custom-dropdown">
                                {sugerenciasClaves.map(c => (
                                    <li key={c.clave} onClick={() => seleccionarClave(c)}>
                                        <strong>{c.clave}</strong> - {c.descripcion}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Tipo (Interno)</label>
                        <select value={conceptoActual.tipo} onChange={e => setConceptoActual({...conceptoActual, tipo: e.target.value})}>
                            <option value="" disabled>Selecciona Producto o Servicio</option>
                            <option value="Producto">Producto</option>
                            <option value="Servicio">Servicio</option>
                        </select>
                    </div>

                    {/* BUSCADOR REAL: UNIDAD SAT */}
                    <div className="form-group" style={{ position: 'relative' }}>
                        <label>Unidad de medida (SAT)</label>
                        <input type="text" placeholder="Escribe unidad..." value={conceptoActual.unidad} onChange={manejarCambioUnidad} />
                        {sugerenciasUnidades.length > 0 && (
                            <ul className="custom-dropdown">
                                {sugerenciasUnidades.map(u => (
                                    <li key={u.clave} onClick={() => seleccionarUnidad(u)}>
                                        <strong>{u.clave}</strong> - {u.nombre}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Cantidad</label>
                        <input type="number" value={conceptoActual.cantidad} onChange={e => setConceptoActual({...conceptoActual, cantidad: e.target.value})} />
                    </div>

                    <div className="form-group">
                        <label>Precio unitario</label>
                        <div className="input-currency">
                            <span>$</span>
                            <input type="number" placeholder="0.00" value={conceptoActual.precioUnitario} onChange={e => setConceptoActual({...conceptoActual, precioUnitario: e.target.value})} />
                        </div>
                    </div>
                </div>

                <div className="form-group" style={{ marginTop: '15px' }}>
                    <label>Descripción detallada</label>
                    <textarea ref={textareaRef} className="auto-textarea" rows="1" placeholder="Describe tu producto o servicio..." value={conceptoActual.descripcion} onChange={autoResizeTextarea} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                    <h3 style={{ margin: 0, color: '#0ea5e9' }}>Importe: ${importeActual.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h3>
                    <button className="btn-primary" onClick={manejarAgregarConcepto}>+ Agregar Concepto</button>
                </div>
            </div>

            {/* TABLA DE CONCEPTOS AGREGADOS */}
            {listaConceptos.length > 0 && (
                <div className="tabla-conceptos-container">
                    <table className="tabla-conceptos">
                        <thead>
                            <tr>
                                <th>Clave</th>
                                <th>Tipo</th>
                                <th>Cant.</th>
                                <th>Unidad</th>
                                <th>P. Unitario</th>
                                <th>Importe</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listaConceptos.map((c, i) => (
                                <tr key={i}>
                                    <td>{c.clave.split(' ')[0]}</td>
                                    <td>{c.tipo}</td>
                                    <td>{c.cantidad}</td>
                                    <td>{c.unidad.split(' ')[0]}</td>
                                    <td>${parseFloat(c.precioUnitario).toLocaleString('es-MX')}</td>
                                    <td><strong>${c.importe.toLocaleString('es-MX')}</strong></td>
                                    <td>
                                        <button className="btn-edit-small" onClick={() => editarConcepto(i)}>Editar</button>
                                        <button className="btn-delete-small" style={{marginLeft: '8px'}} onClick={() => eliminarConcepto(i)}>Eliminar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="totales-factura">
                        <p>Subtotal: <span>${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></p>
                        <p>IVA (16%): <span>${iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></p>
                        <h3 className="total-final">Total: <span>${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></h3>
                    </div>
                </div>
            )}

            <div className="footer-factura">
                <button className="btn-success" onClick={enviarBorrador}>
                    {facturaEditando ? 'Actualizar Borrador' : 'Guardar Borrador'}
                </button>
            </div>
        </div>
    );
};

export default CrearFactura;
