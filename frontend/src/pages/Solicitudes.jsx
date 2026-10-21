import { useState, useEffect } from 'react';
import { Plus, X, FilePlus, Trash2, Pencil, TriangleAlert, Undo2, Ban } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import BarraFiltros from '../components/BarraFiltros';
import Paginacion from '../components/Paginacion';
import { normalizar, paginar } from '../utils/listas';
import { formatFecha, esAtrasada, ESTADO_ESTILOS, ESTILO_ATRASADA } from '../utils/solicitudes';

const LINEA_VACIA = { itemId: '', cantidad: 1 };
const MAX_MOTIVO = 250;

const OPCIONES_ESTADO = [
  { valor: 'TODOS', texto: 'Todos los estados' },
  { valor: 'PENDIENTE', texto: 'Pendientes' },
  { valor: 'APROBADA', texto: 'Aprobadas (en préstamo)' },
  { valor: 'ATRASADA', texto: 'Atrasadas' },
  { valor: 'DEVUELTA', texto: 'Devueltas' },
  { valor: 'RECHAZADA', texto: 'Rechazadas' },
  { valor: 'CANCELADA', texto: 'Canceladas' },
];

const estiloBadge = {
  padding: '0.25rem 0.75rem',
  borderRadius: '100px',
  fontSize: '0.75rem',
  fontWeight: 600,
  display: 'inline-block',
};

const estiloAviso = {
  backgroundColor: '#fee2e2',
  color: '#991b1b',
  padding: '0.75rem 1rem',
  borderRadius: 'var(--border-radius)',
  fontSize: '0.85rem',
  marginBottom: '1.25rem',
};

export default function Solicitudes() {
  const user = JSON.parse(localStorage.getItem('cosmo_user') || '{}');
  const userRol = user?.rol ? user.rol.toUpperCase() : '';
  const isAdmin = userRol === 'ADMIN';
  const canCreate = userRol === 'ADMIN' || userRol === 'PROFESOR' || userRol === 'DOCENTE';

  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Búsqueda, filtro y paginación. El admin entra viendo su cola de trabajo: las pendientes.
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState(isAdmin ? 'PENDIENTE' : 'TODOS');
  const [pagina, setPagina] = useState(1);

  // Modal de crear / editar solicitud
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null); // la solicitud que se edita, o null si es nueva
  const [items, setItems] = useState([]);
  const [lineas, setLineas] = useState([LINEA_VACIA]);
  const [ubicacionUso, setUbicacionUso] = useState('');
  const [horaLimite, setHoraLimite] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal de rechazo (pide el motivo)
  const [rechazando, setRechazando] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [motivoError, setMotivoError] = useState('');
  const [enviandoRechazo, setEnviandoRechazo] = useState(false);

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const fetchSolicitudes = async () => {
    try {
      const response = isAdmin
        ? await api.get('/solicitudes')
        : await api.get('/solicitudes/mias');
      // Más recientes primero
      setSolicitudes([...response.data].sort((a, b) => b.id - a.id));
    } catch (error) {
      console.error("Error fetching solicitudes", error);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Lista filtrada ----------

  const textoBusqueda = normalizar(busqueda.trim());
  const atrasadas = solicitudes.filter(esAtrasada);

  const filtradas = solicitudes.filter((sol) => {
    if (filtroEstado === 'ATRASADA' && !esAtrasada(sol)) return false;
    if (filtroEstado !== 'TODOS' && filtroEstado !== 'ATRASADA' && sol.estado !== filtroEstado) return false;
    if (!textoBusqueda) return true;

    const materiales = (sol.detalles || []).map((d) => d.nombreItem).join(' ');
    const texto = `${sol.id} ${sol.nombreSolicitante} ${sol.ubicacionUso} ${materiales} ${sol.motivoRechazo} ${sol.estado}`;
    return normalizar(texto).includes(textoBusqueda);
  });
  const { visibles, paginaActual, totalPaginas } = paginar(filtradas, pagina);
  const hayFiltros = textoBusqueda !== '' || filtroEstado !== 'TODOS';

  const cambiarBusqueda = (valor) => { setBusqueda(valor); setPagina(1); };
  const cambiarFiltroEstado = (valor) => { setFiltroEstado(valor); setPagina(1); };

  // ---------- Crear / editar ----------

  // Cuántas unidades de un item tiene apartadas la solicitud que se está editando
  // (esas unidades ya no cuentan como "disponibles" en el inventario, pero son suyas)
  const apartadasPorEstaSolicitud = (itemId) => {
    if (!editando || editando.stockReservado !== true) return 0;
    return (editando.detalles || [])
      .filter((d) => String(d.itemId) === String(itemId))
      .reduce((total, d) => total + d.cantidadSolicitada, 0);
  };

  const disponiblesPara = (item) => item.cantidadDisponible + apartadasPorEstaSolicitud(item.id);

  const findItem = (itemId) => items.find((it) => String(it.id) === String(itemId));

  const abrirModal = async (solicitud = null) => {
    setErrorMsg('');
    setEditando(solicitud);
    if (solicitud) {
      setLineas(solicitud.detalles.map((d) => ({ itemId: String(d.itemId), cantidad: d.cantidadSolicitada })));
      setUbicacionUso(solicitud.ubicacionUso || '');
      setHoraLimite(solicitud.horaLimite ? solicitud.horaLimite.slice(0, 16) : '');
    } else {
      setLineas([LINEA_VACIA]);
      setUbicacionUso('');
      setHoraLimite('');
    }
    try {
      const res = await api.get('/items');
      setItems(res.data);
    } catch (error) {
      console.error("Error fetching items", error);
      setItems([]);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditando(null);
    setLineas([LINEA_VACIA]);
    setUbicacionUso('');
    setHoraLimite('');
    setErrorMsg('');
  };

  const actualizarLinea = (index, cambios) => {
    setLineas((prev) => prev.map((l, i) => (i === index ? { ...l, ...cambios } : l)));
  };
  const agregarLinea = () => setLineas((prev) => [...prev, LINEA_VACIA]);
  const quitarLinea = (index) => setLineas((prev) => prev.filter((_, i) => i !== index));

  const handleSubmitSolicitud = async (e) => {
    e.preventDefault();

    if (lineas.some((l) => !l.itemId)) {
      setErrorMsg('Selecciona un material en cada línea');
      return;
    }
    for (const linea of lineas) {
      const item = findItem(linea.itemId);
      if (item && linea.cantidad > disponiblesPara(item)) {
        setErrorMsg(`Solo hay ${disponiblesPara(item)} unidades disponibles de "${item.nombre}"`);
        return;
      }
    }
    if (!ubicacionUso.trim()) {
      setErrorMsg('Ingresa la ubicación de uso');
      return;
    }
    if (new Date(horaLimite) <= new Date()) {
      setErrorMsg('La fecha y hora límite deben ser posteriores al momento actual');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      // datetime-local produce 'YYYY-MM-DDTHH:mm', le agregamos ':00' para el formato LocalDateTime
      const formattedHoraLimite = horaLimite.length === 16 ? `${horaLimite}:00` : horaLimite;

      const payload = {
        ubicacionUso: ubicacionUso.trim(),
        horaLimite: formattedHoraLimite,
        detalles: lineas.map((l) => ({
          itemId: Number(l.itemId),
          cantidadSolicitada: Number(l.cantidad),
        })),
      };

      if (editando) {
        await api.put(`/solicitudes/${editando.id}`, payload);
      } else {
        await api.post('/solicitudes', payload);
      }
      closeModal();
      fetchSolicitudes();
    } catch (error) {
      console.error("Error guardando solicitud", error);
      setErrorMsg(getErrorMessage(error, 'Error al enviar la solicitud. Revisa los datos e intenta de nuevo.'));
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Acciones sobre una solicitud ----------

  const ejecutar = async (peticion, mensajeError) => {
    try {
      await peticion();
    } catch (error) {
      console.error(mensajeError, error);
      alert(getErrorMessage(error, mensajeError));
    }
    fetchSolicitudes();
  };

  const aprobar = (sol) =>
    ejecutar(() => api.put(`/solicitudes/${sol.id}/estado?nuevoEstado=APROBADA`),
      'No se pudo aprobar la solicitud');

  const marcarDevuelta = (sol) => {
    if (!window.confirm(`¿Confirmas que los materiales de la solicitud #${sol.id} fueron devueltos?`)) return;
    return ejecutar(() => api.put(`/solicitudes/${sol.id}/estado?nuevoEstado=DEVUELTA`),
      'No se pudo registrar la devolución');
  };

  const cancelar = (sol) => {
    if (!window.confirm(`¿Cancelar la solicitud #${sol.id}? Los materiales apartados volverán al inventario.`)) return;
    return ejecutar(() => api.put(`/solicitudes/${sol.id}/cancelar`),
      'No se pudo cancelar la solicitud');
  };

  const abrirRechazo = (sol) => {
    setRechazando(sol);
    setMotivo('');
    setMotivoError('');
  };

  const cerrarRechazo = () => {
    setRechazando(null);
    setMotivo('');
    setMotivoError('');
  };

  const confirmarRechazo = async (e) => {
    e.preventDefault();
    if (!motivo.trim()) {
      setMotivoError('Escribe el motivo del rechazo');
      return;
    }
    setEnviandoRechazo(true);
    try {
      await api.put(
        `/solicitudes/${rechazando.id}/estado?nuevoEstado=RECHAZADA&motivo=${encodeURIComponent(motivo.trim())}`
      );
      cerrarRechazo();
      fetchSolicitudes();
    } catch (error) {
      console.error("Error rechazando solicitud", error);
      setMotivoError(getErrorMessage(error, 'No se pudo rechazar la solicitud'));
    } finally {
      setEnviandoRechazo(false);
    }
  };

  const columns = isAdmin ? 7 : 6;
  const noHayItems = items.filter((it) => it.activo !== false && disponiblesPara(it) > 0).length === 0;
  const idsElegidos = lineas.map((l) => String(l.itemId));
  const itemsElegibles = items.filter((it) => (it.activo !== false && disponiblesPara(it) > 0) || idsElegidos.includes(String(it.id)));

  return (
    <div>
      {/* Header section with action button */}
      <div className="flex-between" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Solicitudes</h1>
          <p style={{ margin: 0 }}>
            {isAdmin ? 'Gestión de solicitudes y devoluciones de material' : 'Tu historial de materiales solicitados'}
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => abrirModal()}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={18} />
            <span>NUEVA SOLICITUD</span>
          </button>
        )}
      </div>

      {/* Alerta de devoluciones atrasadas */}
      {atrasadas.length > 0 && (
        <div style={{ ...estiloAviso, display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <TriangleAlert size={18} />
          <span style={{ flex: 1 }}>
            {isAdmin
              ? `Hay ${atrasadas.length} ${atrasadas.length === 1 ? 'solicitud con la devolución atrasada' : 'solicitudes con la devolución atrasada'}.`
              : `Tienes ${atrasadas.length} ${atrasadas.length === 1 ? 'solicitud' : 'solicitudes'} con material sin devolver pasada la hora límite.`}
          </span>
          {filtroEstado !== 'ATRASADA' && (
            <button
              className="btn btn-outline"
              style={{ padding: '0.3rem 0.8rem', borderColor: '#991b1b', color: '#991b1b' }}
              onClick={() => cambiarFiltroEstado('ATRASADA')}
            >
              Ver
            </button>
          )}
        </div>
      )}

      <BarraFiltros
        busqueda={busqueda}
        onBusqueda={cambiarBusqueda}
        placeholder={isAdmin ? 'Buscar por solicitante, material, ubicación o #...' : 'Buscar por material, ubicación o #...'}
      >
        <select
          className="form-input"
          style={{ width: 'auto', minWidth: '200px' }}
          value={filtroEstado}
          onChange={(e) => cambiarFiltroEstado(e.target.value)}
        >
          {OPCIONES_ESTADO.map((op) => (
            <option key={op.valor} value={op.valor}>{op.texto}</option>
          ))}
        </select>
      </BarraFiltros>

      {/* Table section */}
      <div className="surface" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: '720px', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--table-header-bg)' }}>
              <th className="th-label" style={{ padding: '1rem 1.5rem', margin: 0 }}>ID</th>
              {isAdmin && <th className="th-label" style={{ padding: '1rem 1.5rem', margin: 0 }}>Solicitante</th>}
              <th className="th-label" style={{ padding: '1rem 1.5rem', margin: 0 }}>Materiales</th>
              <th className="th-label" style={{ padding: '1rem 1.5rem', margin: 0 }}>Ubicación</th>
              <th className="th-label" style={{ padding: '1rem 1.5rem', margin: 0 }}>Hora límite</th>
              <th className="th-label" style={{ padding: '1rem 1.5rem', margin: 0 }}>Estado</th>
              <th className="th-label" style={{ padding: '1rem 1.5rem', margin: 0 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando solicitudes...</td></tr>
            ) : filtradas.length === 0 ? (
              <tr><td colSpan={columns} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                {hayFiltros ? 'Ninguna solicitud coincide con los filtros.' : 'No hay solicitudes en este momento.'}
              </td></tr>
            ) : visibles.map((sol) => {
              const esMia = sol.solicitanteId === user.id;
              const atrasada = esAtrasada(sol);

              return (
                <tr key={sol.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '1.25rem 1.5rem', fontWeight: 600 }}>#{sol.id}</td>
                  {isAdmin && (
                    <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>
                      {sol.nombreSolicitante || '—'}
                    </td>
                  )}
                  <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {(sol.detalles || []).map((d, i) => (
                      <div key={i}>
                        {d.nombreItem || `Item #${d.itemId}`}{' '}
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>× {d.cantidadSolicitada}</span>
                      </div>
                    ))}
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>
                    {sol.ubicacionUso || 'No especificada'}
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', color: atrasada ? '#991b1b' : 'var(--text-secondary)', fontWeight: atrasada ? 600 : 400, whiteSpace: 'nowrap' }}>
                    {formatFecha(sol.horaLimite)}
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      <span style={{ ...estiloBadge, ...ESTADO_ESTILOS[sol.estado] }}>{sol.estado}</span>
                      {atrasada && <span style={{ ...estiloBadge, ...ESTILO_ATRASADA }}>ATRASADA</span>}
                    </div>
                    {sol.estado === 'RECHAZADA' && sol.motivoRechazo && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.4rem', maxWidth: '220px' }}>
                        Motivo: {sol.motivoRechazo}
                      </div>
                    )}
                    {sol.estado === 'DEVUELTA' && sol.fechaHoraDevolucion && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                        Devuelta el {formatFecha(sol.fechaHoraDevolucion)}
                      </div>
                    )}
                    {sol.nombreRevisadoPor && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        por {sol.nombreRevisadoPor}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {isAdmin && sol.estado === 'PENDIENTE' && (
                        <>
                          <button
                            onClick={() => aprobar(sol)}
                            className="btn btn-outline"
                            style={{ padding: '0.4rem 0.8rem', borderColor: '#22c55e', color: '#166534' }}
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() => abrirRechazo(sol)}
                            className="btn btn-outline"
                            style={{ padding: '0.4rem 0.8rem', borderColor: '#ef4444', color: '#991b1b' }}
                          >
                            Rechazar
                          </button>
                        </>
                      )}
                      {isAdmin && sol.estado === 'APROBADA' && (
                        <button
                          onClick={() => marcarDevuelta(sol)}
                          className="btn btn-outline"
                          style={{ padding: '0.4rem 0.8rem' }}
                        >
                          <Undo2 size={14} /> Marcar devuelto
                        </button>
                      )}
                      {esMia && sol.estado === 'PENDIENTE' && (
                        <>
                          <button
                            onClick={() => abrirModal(sol)}
                            className="btn btn-outline"
                            style={{ padding: '0.4rem 0.6rem' }}
                            title="Editar mi solicitud"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => cancelar(sol)}
                            className="btn btn-outline"
                            style={{ padding: '0.4rem 0.6rem' }}
                            title="Cancelar mi solicitud"
                          >
                            <Ban size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
        <Paginacion pagina={paginaActual} totalPaginas={totalPaginas} total={filtradas.length} onCambiar={setPagina} />
      </div>

      {/* Modal para Crear / Editar Solicitud */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FilePlus size={20} style={{ color: 'var(--accent-color)' }} />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                  {editando ? `Editar Solicitud #${editando.id}` : 'Nueva Solicitud de Material'}
                </h2>
              </div>
              <button onClick={closeModal} className="modal-close-btn" title="Cerrar">
                <X size={20} />
              </button>
            </div>

            {errorMsg && <div style={estiloAviso}>{errorMsg}</div>}

            <form onSubmit={handleSubmitSolicitud}>
              {/* Materiales: uno o varios, elegidos del inventario */}
              <div className="form-group">
                <label className="form-label">Materiales Solicitados *</label>

                {noHayItems && (
                  <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    No hay materiales disponibles en el inventario por ahora.
                  </p>
                )}

                {lineas.map((linea, index) => {
                  const itemElegido = findItem(linea.itemId);
                  const elegidosEnOtrasLineas = lineas
                    .filter((_, i) => i !== index)
                    .map((l) => String(l.itemId));

                  return (
                    <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <select
                        className="form-input"
                        style={{ flex: 1 }}
                        value={linea.itemId}
                        onChange={(e) => actualizarLinea(index, { itemId: e.target.value, cantidad: 1 })}
                        disabled={noHayItems && !linea.itemId}
                        required
                      >
                        <option value="">Selecciona un material</option>
                        {itemsElegibles.map((item) => (
                          <option
                            key={item.id}
                            value={item.id}
                            disabled={elegidosEnOtrasLineas.includes(String(item.id))}
                          >
                            {item.nombre} (disponibles: {disponiblesPara(item)})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        max={itemElegido ? disponiblesPara(itemElegido) : undefined}
                        className="form-input"
                        style={{ width: '90px' }}
                        value={linea.cantidad}
                        onChange={(e) => actualizarLinea(index, { cantidad: Math.max(1, parseInt(e.target.value) || 1) })}
                        title="Cantidad"
                        required
                      />
                      {lineas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => quitarLinea(index)}
                          className="btn btn-outline"
                          style={{ padding: '0.4rem 0.6rem' }}
                          title="Quitar material"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={agregarLinea}
                  className="btn btn-outline"
                  style={{ marginTop: '0.25rem', padding: '0.4rem 0.8rem' }}
                  disabled={lineas.length >= itemsElegibles.length}
                >
                  <Plus size={14} /> Agregar otro material
                </button>
              </div>

              {/* Ubicación de Uso */}
              <div className="form-group">
                <label className="form-label">Ubicación de Uso *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Salón 101, Laboratorio de Ciencias, Patio..."
                  value={ubicacionUso}
                  onChange={(e) => setUbicacionUso(e.target.value)}
                  maxLength={150}
                  required
                />
              </div>

              {/* Fecha / Hora Límite */}
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Fecha y Hora Límite de Devolución *</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={horaLimite}
                  onChange={(e) => setHoraLimite(e.target.value)}
                  required
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-outline"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || (noHayItems && !editando)}
                >
                  {submitting ? 'ENVIANDO...' : editando ? 'GUARDAR CAMBIOS' : 'ENVIAR SOLICITUD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Rechazar (pide el motivo) */}
      {rechazando && (
        <div className="modal-overlay" onClick={cerrarRechazo}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Rechazar Solicitud #{rechazando.id}</h2>
              <button onClick={cerrarRechazo} className="modal-close-btn" title="Cerrar">
                <X size={20} />
              </button>
            </div>

            {motivoError && <div style={estiloAviso}>{motivoError}</div>}

            <form onSubmit={confirmarRechazo}>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Motivo del rechazo *</label>
                <textarea
                  className="form-input"
                  rows={4}
                  maxLength={MAX_MOTIVO}
                  placeholder="Explícale al solicitante por qué no se aprueba..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  style={{ resize: 'vertical' }}
                  autoFocus
                  required
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right', marginTop: '0.25rem' }}>
                  {motivo.length}/{MAX_MOTIVO}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={cerrarRechazo} className="btn btn-outline" disabled={enviandoRechazo}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ backgroundColor: '#dc2626' }}
                  disabled={enviandoRechazo}
                >
                  {enviandoRechazo ? 'RECHAZANDO...' : 'RECHAZAR SOLICITUD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
