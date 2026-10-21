import { useState, useEffect } from 'react';
import { Plus, X, Package, Pencil, Trash2, RotateCcw } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import BarraFiltros from '../components/BarraFiltros';
import Paginacion from '../components/Paginacion';
import { normalizar, paginar } from '../utils/listas';

const EMPTY_FORM = { nombre: '', descripcion: '', cantidadDisponible: 0, ubicacionAlmacen: '' };

export default function Items() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [pagina, setPagina] = useState(1);

  const user = JSON.parse(localStorage.getItem('cosmo_user') || '{}');
  const isAdmin = user?.rol?.toUpperCase() === 'ADMIN';

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await api.get('/items');
      setItems(response.data);
    } catch (error) {
      console.error("Error fetching items", error);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrorMsg('');
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      nombre: item.nombre ?? '',
      descripcion: item.descripcion ?? '',
      cantidadDisponible: item.cantidadDisponible ?? 0,
      ubicacionAlmacen: item.ubicacionAlmacen ?? '',
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrorMsg('');
  };

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setErrorMsg('El nombre es obligatorio');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      cantidadDisponible: Number(form.cantidadDisponible),
      ubicacionAlmacen: form.ubicacionAlmacen.trim(),
    };

    try {
      if (editingId) {
        await api.put(`/items/${editingId}`, payload);
      } else {
        await api.post('/items', payload);
      }
      closeModal();
      fetchItems();
    } catch (error) {
      console.error("Error guardando item", error);
      setErrorMsg(getErrorMessage(error, 'No se pudo guardar el item. Revisa los datos e intenta de nuevo.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`¿Eliminar "${item.nombre}" del inventario?`)) return;
    try {
      const response = await api.delete(`/items/${item.id}`);
      fetchItems();
      if (response.data?.mensaje) alert(response.data.mensaje);
    } catch (error) {
      console.error("Error eliminando item", error);
      alert(getErrorMessage(error, 'No se pudo eliminar el item.'));
    }
  };

  const handleReactivar = async (item) => {
    try {
      await api.put(`/items/${item.id}/reactivar`);
      fetchItems();
    } catch (error) {
      console.error("Error reactivando item", error);
      alert(getErrorMessage(error, 'No se pudo reactivar el item.'));
    }
  };

  const columns = isAdmin ? 6 : 4;

  const textoBusqueda = normalizar(busqueda.trim());
  // Los items dados de baja solo le interesan al admin (para poder reactivarlos);
  // a un profesor no tiene sentido mostrarle algo que ya no se puede solicitar.
  const itemsVisibles = isAdmin ? items : items.filter((item) => item.activo !== false);
  const filtrados = itemsVisibles.filter((item) => {
    if (filtroEstado === 'DISPONIBLE' && !(item.cantidadDisponible > 0)) return false;
    if (filtroEstado === 'AGOTADO' && item.cantidadDisponible > 0) return false;
    if (!textoBusqueda) return true;
    return normalizar(`${item.nombre} ${item.descripcion} ${item.ubicacionAlmacen}`).includes(textoBusqueda);
  });
  const { visibles, paginaActual, totalPaginas } = paginar(filtrados, pagina);
  const hayFiltros = textoBusqueda !== '' || filtroEstado !== 'TODOS';

  const cambiarBusqueda = (valor) => { setBusqueda(valor); setPagina(1); };
  const cambiarFiltroEstado = (valor) => { setFiltroEstado(valor); setPagina(1); };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Inventario</h1>
          <p style={{ margin: 0 }}>Gestión de activos y materiales</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> NUEVO ITEM
          </button>
        )}
      </div>

      <BarraFiltros
        busqueda={busqueda}
        onBusqueda={cambiarBusqueda}
        placeholder="Buscar por nombre, descripción o ubicación..."
      >
        <select
          className="form-input"
          style={{ width: 'auto', minWidth: '160px' }}
          value={filtroEstado}
          onChange={(e) => cambiarFiltroEstado(e.target.value)}
        >
          <option value="TODOS">Todos los estados</option>
          <option value="DISPONIBLE">Disponibles</option>
          <option value="AGOTADO">Agotados</option>
        </select>
      </BarraFiltros>

      <div className="surface" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: '640px', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--table-header-bg)' }}>
              <th className="th-label" style={{ padding: '1rem 1.5rem', margin: 0 }}>Nombre</th>
              <th className="th-label" style={{ padding: '1rem 1.5rem', margin: 0 }}>Descripción</th>
              {isAdmin && <th className="th-label" style={{ padding: '1rem 1.5rem', margin: 0 }}>Ubicación</th>}
              <th className="th-label" style={{ padding: '1rem 1.5rem', margin: 0 }}>Disponibles</th>
              <th className="th-label" style={{ padding: '1rem 1.5rem', margin: 0 }}>Estado</th>
              {isAdmin && <th className="th-label" style={{ padding: '1rem 1.5rem', margin: 0 }}>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando inventario...</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={columns} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                {hayFiltros ? 'Ningún item coincide con la búsqueda.' : 'No hay items registrados.'}
              </td></tr>
            ) : visibles.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '1.25rem 1.5rem', fontWeight: 500 }}>{item.nombre}</td>
                <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>{item.descripcion}</td>
                {isAdmin && (
                  <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>{item.ubicacionAlmacen}</td>
                )}
                <td style={{ padding: '1.25rem 1.5rem' }}>{item.cantidadDisponible}</td>
                <td style={{ padding: '1.25rem 1.5rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '100px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    backgroundColor: item.activo === false ? '#e5e7eb' : item.cantidadDisponible > 0 ? '#dcfce7' : '#fee2e2',
                    color: item.activo === false ? '#4b5563' : item.cantidadDisponible > 0 ? '#166534' : '#991b1b'
                  }}>
                    {item.activo === false ? 'De baja' : item.cantidadDisponible > 0 ? 'Disponible' : 'Agotado'}
                  </span>
                </td>
                {isAdmin && (
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {item.activo === false ? (
                        <button
                          onClick={() => handleReactivar(item)}
                          className="btn btn-outline"
                          style={{ padding: '0.4rem 0.6rem' }}
                          title="Reactivar"
                        >
                          <RotateCcw size={14} />
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => openEdit(item)}
                            className="btn btn-outline"
                            style={{ padding: '0.4rem 0.6rem' }}
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="btn btn-outline"
                            style={{ padding: '0.4rem 0.6rem', borderColor: '#ef4444', color: '#991b1b' }}
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <Paginacion pagina={paginaActual} totalPaginas={totalPaginas} total={filtrados.length} onCambiar={setPagina} />
      </div>

      {/* Modal para crear / editar item */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={20} style={{ color: 'var(--accent-color)' }} />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                  {editingId ? 'Editar Item' : 'Nuevo Item'}
                </h2>
              </div>
              <button onClick={closeModal} className="modal-close-btn" title="Cerrar">
                <X size={20} />
              </button>
            </div>

            {errorMsg && (
              <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: 'var(--border-radius)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Marcadores, Proyector..."
                  value={form.nombre}
                  onChange={(e) => updateField('nombre', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.descripcion}
                  onChange={(e) => updateField('descripcion', e.target.value)}
                  maxLength={250}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cantidad Disponible *</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={form.cantidadDisponible}
                  onChange={(e) => updateField('cantidadDisponible', e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Ubicación en Almacén</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Bodega 2, Estante B"
                  value={form.ubicacionAlmacen}
                  onChange={(e) => updateField('ubicacionAlmacen', e.target.value)}
                  maxLength={100}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={closeModal} className="btn btn-outline" disabled={submitting}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'GUARDANDO...' : editingId ? 'GUARDAR CAMBIOS' : 'CREAR ITEM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
