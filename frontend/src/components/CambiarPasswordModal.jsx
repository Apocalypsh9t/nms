import { useState } from 'react';
import { X, KeyRound } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';

export default function CambiarPasswordModal({ onClose }) {
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (passwordNueva !== confirmacion) {
      setError('La confirmación no coincide con la nueva contraseña');
      return;
    }

    setEnviando(true);
    try {
      await api.put('/usuarios/cambiar-password', { passwordActual, passwordNueva });
      setExito(true);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo cambiar la contraseña'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <KeyRound size={20} style={{ color: 'var(--accent-color)' }} />
            <h2>Cambiar contraseña</h2>
          </div>
          <button onClick={onClose} className="modal-close-btn" title="Cerrar">
            <X size={20} />
          </button>
        </div>

        {exito ? (
          <div>
            <div style={{ backgroundColor: 'var(--tag-green-bg)', color: 'var(--tag-green-text)', padding: '0.75rem 1rem', borderRadius: 'var(--border-radius)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Tu contraseña se actualizó correctamente.
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={onClose}>Listo</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: 'var(--border-radius)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Contraseña actual</label>
              <input
                type="password"
                className="form-input"
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nueva contraseña</label>
              <input
                type="password"
                className="form-input"
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                minLength={4}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Confirmar nueva contraseña</label>
              <input
                type="password"
                className="form-input"
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
                minLength={4}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" onClick={onClose} className="btn btn-outline" disabled={enviando}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={enviando}>
                {enviando ? 'GUARDANDO...' : 'CAMBIAR CONTRASEÑA'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
