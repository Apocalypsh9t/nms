import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellRing, Check } from 'lucide-react';
import api from '../services/api';

const INTERVALO_MS = 20000;

// Traduce el tipo que manda el backend a un texto corto para el título del pop-up nativo
const TITULOS = {
  SOLICITUD_CREADA: 'Nueva solicitud',
  SOLICITUD_APROBADA: 'Solicitud aprobada',
  SOLICITUD_RECHAZADA: 'Solicitud rechazada',
  SOLICITUD_DEVUELTA: 'Devolución registrada',
  SOLICITUD_ATRASADA: 'Devolución atrasada',
};

export default function Notificaciones() {
  const navigate = useNavigate();
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [abierto, setAbierto] = useState(false);
  const idsVistos = useRef(new Set());
  const primerCarga = useRef(true);
  const contenedorRef = useRef(null);
  const botonRef = useRef(null);
  const [posicion, setPosicion] = useState(null);

  const pedirPermisoNotificaciones = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const dispararPopUpNativo = useCallback((notif) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const n = new Notification(TITULOS[notif.tipo] || 'Cosmo Schools', {
      body: notif.mensaje,
      icon: '/favicon.png',
      tag: `cosmo-notif-${notif.id}`,
    });
    n.onclick = () => {
      window.focus();
      if (notif.solicitudId) navigate('/solicitudes');
      n.close();
    };
  }, [navigate]);

  const consultar = useCallback(async () => {
    try {
      const res = await api.get('/notificaciones/mias');
      const lista = res.data;
      setNotificaciones(lista);
      setNoLeidas(lista.filter((n) => !n.leida).length);

      if (primerCarga.current) {
        // En la primera carga solo se registran los ids existentes; no se dispara ningún
        // pop-up para no bombardear con notificaciones viejas apenas se abre la página.
        lista.forEach((n) => idsVistos.current.add(n.id));
        primerCarga.current = false;
        return;
      }

      lista
        .filter((n) => !n.leida && !idsVistos.current.has(n.id))
        .forEach((n) => {
          idsVistos.current.add(n.id);
          dispararPopUpNativo(n);
        });
    } catch (error) {
      console.error('Error consultando notificaciones', error);
    }
  }, [dispararPopUpNativo]);

  useEffect(() => {
    pedirPermisoNotificaciones();
    consultar();
    const intervalo = setInterval(consultar, INTERVALO_MS);
    return () => clearInterval(intervalo);
  }, [consultar]);

  useEffect(() => {
    const cerrarSiClicAfuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setAbierto(false);
      }
    };
    document.addEventListener('mousedown', cerrarSiClicAfuera);
    return () => document.removeEventListener('mousedown', cerrarSiClicAfuera);
  }, []);

  const marcarLeida = async (notif) => {
    if (!notif.leida) {
      try {
        await api.put(`/notificaciones/${notif.id}/leida`);
        setNotificaciones((prev) => prev.map((n) => (n.id === notif.id ? { ...n, leida: true } : n)));
        setNoLeidas((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marcando notificación', error);
      }
    }
    setAbierto(false);
    if (notif.solicitudId) navigate('/solicitudes');
  };

  const marcarTodasLeidas = async () => {
    try {
      await api.put('/notificaciones/leer-todas');
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
      setNoLeidas(0);
    } catch (error) {
      console.error('Error marcando todas como leídas', error);
    }
  };

  const formatearFecha = (iso) => {
    const fecha = new Date(iso);
    return fecha.toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const alternarAbierto = () => {
    if (!abierto && botonRef.current) {
      const rect = botonRef.current.getBoundingClientRect();
      const ancho = Math.min(340, window.innerWidth - 16);
      const left = Math.min(Math.max(8, rect.right - ancho), window.innerWidth - ancho - 8);
      setPosicion({ top: rect.bottom + 8, left, ancho });
    }
    setAbierto((v) => !v);
  };

  return (
    <div ref={contenedorRef} style={{ position: 'relative' }}>
      <button
        ref={botonRef}
        onClick={alternarAbierto}
        title="Notificaciones"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          padding: '0.4rem',
          color: 'inherit',
        }}
      >
        {noLeidas > 0 ? <BellRing size={20} /> : <Bell size={20} />}
        {noLeidas > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              backgroundColor: '#ef4444',
              color: '#fff',
              borderRadius: '999px',
              fontSize: '0.65rem',
              fontWeight: 700,
              minWidth: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
            }}
          >
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {abierto && posicion && (
        <div
          className="surface"
          style={{
            position: 'fixed',
            top: `${posicion.top}px`,
            left: `${posicion.left}px`,
            width: `${posicion.ancho}px`,
            maxHeight: '420px',
            overflowY: 'auto',
            padding: 0,
            zIndex: 1200,
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          }}
        >
          <div className="flex-between" style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border-light)' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notificaciones</span>
            {noLeidas > 0 && (
              <button
                onClick={marcarTodasLeidas}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-color)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <Check size={13} /> Marcar todas
              </button>
            )}
          </div>

          {notificaciones.length === 0 ? (
            <p style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.85rem' }}>No tienes notificaciones</p>
          ) : (
            notificaciones.map((n) => (
              <div
                key={n.id}
                onClick={() => marcarLeida(n)}
                style={{
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  backgroundColor: n.leida ? 'transparent' : 'var(--sidebar-item-hover)',
                }}
              >
                <p style={{ fontSize: '0.8rem', fontWeight: n.leida ? 400 : 600, margin: 0, color: 'var(--text-primary)' }}>
                  {n.mensaje}
                </p>
                <p style={{ fontSize: '0.7rem', margin: 0, marginTop: '0.2rem' }}>{formatearFecha(n.fechaCreacion)}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
