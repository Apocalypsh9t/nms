import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Clock, CheckCircle, PackageCheck, TriangleAlert } from 'lucide-react';
import api from '../services/api';
import { esAtrasada } from '../utils/solicitudes';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ totalItems: 0, pendientes: 0, enPrestamo: 0, atrasadas: 0 });

  useEffect(() => {
    const storedUser = localStorage.getItem('cosmo_user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      fetchOverview(parsed);
    }
  }, []);

  // El admin ve los números de todo el sistema; el profesor, los de sus propias solicitudes
  const fetchOverview = async (usuario) => {
    try {
      const esAdmin = usuario.rol?.toUpperCase() === 'ADMIN';
      const [itemsRes, solRes] = await Promise.all([
        api.get('/items'),
        esAdmin ? api.get('/solicitudes') : api.get('/solicitudes/mias'),
      ]);
      const solicitudes = solRes.data;
      setStats({
        totalItems: itemsRes.data.length,
        pendientes: solicitudes.filter((s) => s.estado === 'PENDIENTE').length,
        enPrestamo: solicitudes.filter((s) => s.estado === 'APROBADA').length,
        atrasadas: solicitudes.filter(esAtrasada).length,
      });
    } catch (error) {
      console.error("Error fetching overview", error);
    }
  };

  if (!user) return null;

  const esAdmin = user.rol?.toUpperCase() === 'ADMIN';
  const hayAtrasadas = stats.atrasadas > 0;

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Resumen General</h1>

      <div className="grid-auto">
        {/* Stat Card 1 - Inventario */}
        <div className="surface stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="flex-between">
            <span className="form-label" style={{ margin: 0 }}>Total Inventario</span>
            {/* Easter egg: nada lo delata, es solo para quien lo toque por curiosidad */}
            <Layers
              size={18}
              color="var(--text-secondary)"
              onClick={() => window.open('https://www.youtube.com/shorts/8sQN9Sbz0a0', '_blank', 'noopener,noreferrer')}
            />
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{stats.totalItems}</div>
          <p style={{ fontSize: '0.8rem', margin: 0 }}>Items registrados en el sistema</p>
        </div>

        {/* Stat Card 2 - Solicitudes Pendientes */}
        <div className="surface stat-card stat-card-warning" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="flex-between">
            <span className="form-label" style={{ margin: 0 }}>{esAdmin ? 'Solicitudes Pendientes' : 'Mis Pendientes'}</span>
            <Clock size={18} color="var(--tag-yellow-text)" />
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{stats.pendientes}</div>
          <p style={{ fontSize: '0.8rem', margin: 0 }}>{esAdmin ? 'Requieren revisión' : 'Esperando revisión'}</p>
        </div>

        {/* Stat Card 3 - En préstamo */}
        <div className="surface stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="flex-between">
            <span className="form-label" style={{ margin: 0 }}>En Préstamo</span>
            <PackageCheck size={18} color="var(--text-secondary)" />
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{stats.enPrestamo}</div>
          <p style={{ fontSize: '0.8rem', margin: 0 }}>Aprobadas y aún sin devolver</p>
        </div>

        {/* Stat Card 4 - Atrasadas: se resalta en rojo cuando hay alguna */}
        <Link
          to="/solicitudes"
          className="surface stat-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            textDecoration: 'none',
            color: 'inherit',
            ...(hayAtrasadas ? { borderColor: '#ef4444', backgroundColor: '#fee2e2' } : {}),
          }}
        >
          <div className="flex-between">
            <span className="form-label" style={{ margin: 0, color: hayAtrasadas ? '#991b1b' : undefined }}>Devoluciones Atrasadas</span>
            <TriangleAlert size={18} color={hayAtrasadas ? '#991b1b' : 'var(--text-secondary)'} />
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: hayAtrasadas ? '#991b1b' : undefined }}>{stats.atrasadas}</div>
          <p style={{ fontSize: '0.8rem', margin: 0, color: hayAtrasadas ? '#991b1b' : undefined }}>
            {hayAtrasadas ? 'Pasaron su hora límite sin devolverse' : 'Todo al día'}
          </p>
        </Link>

        {/* Action Card - Sistema Operativo */}
        <div className="surface stat-card-accent" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--accent-color)', color: 'var(--accent-text)', border: 'none' }}>
          <CheckCircle size={32} style={{ marginBottom: '1rem', opacity: 0.8 }} />
          <h3 style={{ color: 'var(--accent-text)', margin: 0 }}>Sistema Operativo</h3>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem' }}>Rol actual: {user.rol}</p>
        </div>
      </div>
    </div>
  );
}
