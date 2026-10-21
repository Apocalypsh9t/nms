import { Outlet, Link, useNavigate } from 'react-router-dom';
import { LogOut, Package, FileText, LayoutDashboard, Moon, Sun, GraduationCap, Menu, X, KeyRound, UserPen } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../services/api';
import Notificaciones from './Notificaciones';
import CambiarPasswordModal from './CambiarPasswordModal';
import EditarPerfilModal from './EditarPerfilModal';

export default function Layout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCambiarPassword, setShowCambiarPassword] = useState(false);
  const [showEditarPerfil, setShowEditarPerfil] = useState(false);

  const handlePerfilActualizado = (usuarioActualizado) => {
    setUser(usuarioActualizado);
    localStorage.setItem('cosmo_user', JSON.stringify(usuarioActualizado));
  };
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('cosmo_theme') || 'light';
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('cosmo_user');
    const storedToken = localStorage.getItem('cosmo_token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cosmo_theme', theme);
  }, [theme]);

  const handleLogout = () => {
    const refreshToken = localStorage.getItem('cosmo_refresh_token');
    if (refreshToken) {
      // "Fire and forget": si esto falla no importa, la sesión local se limpia igual.
      api.post('/usuarios/logout', { refreshToken }).catch(() => {});
    }
    localStorage.removeItem('cosmo_token');
    localStorage.removeItem('cosmo_refresh_token');
    localStorage.removeItem('cosmo_user');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="app-shell" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      {/* Mobile top bar: solo visible en pantallas angostas (ver index.css) */}
      <header className="mobile-topbar">
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} title="Abrir menú">
          <Menu size={22} />
        </button>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, letterSpacing: '-0.03em', flex: 1 }}>
          COSMO<span className="cosmo-yellow-accent" style={{ fontWeight: 400 }}>SCHOOLS</span>
        </h2>
        <Notificaciones />
      </header>

      {/* Fondo oscuro detrás del menú lateral cuando está abierto en móvil */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar Architectural Component */}
      <aside className={`app-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`} style={{
        width: '260px',
        borderRight: '1px solid var(--sidebar-border)',
        backgroundColor: 'var(--sidebar-bg)',
        color: 'var(--sidebar-text)',
        padding: '2rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        transition: 'var(--transition)'
      }}>
        {/* Brand Header */}
        <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.03em', color: 'var(--sidebar-text)' }}>
                COSMO<span className="cosmo-yellow-accent" style={{ fontWeight: 400 }}>SCHOOLS</span>
              </h2>
              <span className="cosmo-green-dot" title="Sistema Activo"></span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--sidebar-text-muted)', margin: 0, marginTop: '0.25rem' }}>
              Sistema de Inventario
            </p>
          </div>
          <div className="sidebar-bell-desktop">
            <Notificaciones />
          </div>
          <button
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            title="Cerrar menú"
            style={{ background: 'none', border: 'none', color: 'var(--sidebar-text)', cursor: 'pointer', padding: '0.25rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Theme Selector Section */}
        <div style={{ marginBottom: '2rem' }}>
          <span style={{ 
            fontSize: '0.7rem', 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em', 
            fontWeight: 700, 
            color: 'var(--sidebar-text-muted)',
            display: 'block',
            marginBottom: '0.6rem'
          }}>
            Paleta de Colores
          </span>
          <div className="theme-selector-container">
            <button 
              onClick={() => setTheme('dark')} 
              className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
              title="Modo Oscuro Formal"
            >
              <Moon size={15} />
              <span>Oscuro</span>
            </button>
            
            <button 
              onClick={() => setTheme('light')} 
              className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
              title="Modo Claro Predeterminado"
            >
              <Sun size={15} />
              <span>Claro</span>
            </button>

            <button 
              onClick={() => setTheme('cosmo')} 
              className={`theme-btn ${theme === 'cosmo' ? 'active' : ''}`}
              title="Modo Cosmo Schools (Institucional + Acentos Verde/Amarillo)"
            >
              <GraduationCap size={15} />
              <span>Cosmo</span>
            </button>
          </div>
        </div>

        {/* Navigation links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
          <Link to="/" className="sidebar-link" onClick={() => setSidebarOpen(false)}>
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          <Link to="/items" className="sidebar-link" onClick={() => setSidebarOpen(false)}>
            <Package size={18} /> Inventario
          </Link>
          <Link to="/solicitudes" className="sidebar-link" onClick={() => setSidebarOpen(false)}>
            <FileText size={18} /> Solicitudes
          </Link>
        </nav>

        {/* User Info & Logout */}
        <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--sidebar-border)', marginTop: 'auto' }}>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--sidebar-text)', margin: 0 }}>
              {user.nombre}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--sidebar-text-muted)', margin: 0 }}>
              Rol: {user.rol}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.4rem' }}>
              <button
                onClick={() => setShowEditarPerfil(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--sidebar-text-muted)',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: 0,
                }}
              >
                <UserPen size={12} /> Editar perfil
              </button>
              <button
                onClick={() => setShowCambiarPassword(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--sidebar-text-muted)',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: 0,
                }}
              >
                <KeyRound size={12} /> Cambiar contraseña
              </button>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-outline" 
            style={{ 
              width: '100%', 
              justifyContent: 'center',
              borderColor: 'var(--sidebar-border)',
              color: 'var(--sidebar-text)'
            }}
          >
            <LogOut size={16} /> Salir
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="app-main" style={{ flex: 1, padding: '3rem', backgroundColor: 'var(--bg-color)', overflowY: 'auto', transition: 'var(--transition)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>

      {showCambiarPassword && <CambiarPasswordModal onClose={() => setShowCambiarPassword(false)} />}
      {showEditarPerfil && (
        <EditarPerfilModal
          user={user}
          onClose={() => setShowEditarPerfil(false)}
          onActualizado={handlePerfilActualizado}
        />
      )}
    </div>
  );
}
