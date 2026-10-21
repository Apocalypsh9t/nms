import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Moon, Sun, GraduationCap } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('cosmo_theme') || 'light';
  });
  const navigate = useNavigate();
  const registrado = useLocation().state?.registrado;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cosmo_theme', theme);
  }, [theme]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post(`/usuarios/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
      localStorage.setItem('cosmo_token', response.data.token);
      localStorage.setItem('cosmo_refresh_token', response.data.refreshToken);
      localStorage.setItem('cosmo_user', JSON.stringify(response.data.usuario));
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err, 'Credenciales inválidas. Por favor, verifica tus datos.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-color)', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition)', position: 'relative' }}>
      
      {/* Top right theme switcher */}
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
        <div className="theme-selector-container" style={{ width: '220px' }}>
          <button 
            type="button"
            onClick={() => setTheme('dark')} 
            className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
            title="Modo Oscuro Formal"
          >
            <Moon size={14} />
            <span>Oscuro</span>
          </button>
          
          <button 
            type="button"
            onClick={() => setTheme('light')} 
            className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
            title="Modo Claro Predeterminado"
          >
            <Sun size={14} />
            <span>Claro</span>
          </button>

          <button 
            type="button"
            onClick={() => setTheme('cosmo')} 
            className={`theme-btn ${theme === 'cosmo' ? 'active' : ''}`}
            title="Modo Cosmo Schools"
          >
            <GraduationCap size={14} />
            <span>Cosmo</span>
          </button>
        </div>
      </div>

      <div className="surface" style={{ width: '100%', maxWidth: '420px', padding: '3rem 2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
            COSMO<span style={{ fontWeight: 300 }}>SCHOOLS</span>
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Acceso al Sistema de Inventario
          </p>
        </div>

        {registrado && !error && (
          <div style={{ backgroundColor: 'var(--tag-green-bg)', color: 'var(--tag-green-text)', padding: '0.75rem', borderRadius: 'var(--border-radius)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Cuenta creada. Ya puedes iniciar sesión.
          </div>
        )}

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: 'var(--border-radius)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Correo Electrónico</label>
            <input 
              type="email" 
              className="form-input" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@cosmoschools.com"
              required 
            />
          </div>
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Contraseña</label>
            <input 
              type="password" 
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              required 
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem' }} disabled={loading}>
            {loading ? 'INGRESANDO...' : 'INICIAR SESIÓN'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem' }}>
          ¿Eres profesor y no tienes cuenta?{' '}
          <Link to="/registro" style={{ color: 'var(--accent-color)', fontWeight: 600 }}>Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
