export function formatFecha(valor) {
  if (!valor) return '—';
  return new Date(valor).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' });
}

// Una solicitud aprobada cuya hora límite ya pasó y todavía no fue devuelta
export function esAtrasada(sol) {
  return sol.estado === 'APROBADA' && !!sol.horaLimite && new Date(sol.horaLimite) < new Date();
}

export const ESTADO_ESTILOS = {
  PENDIENTE: { backgroundColor: 'var(--tag-yellow-bg)', color: 'var(--tag-yellow-text)' },
  APROBADA: { backgroundColor: 'var(--tag-green-bg)', color: 'var(--tag-green-text)' },
  RECHAZADA: { backgroundColor: '#fee2e2', color: '#991b1b' },
  DEVUELTA: { backgroundColor: 'var(--border-light)', color: 'var(--text-secondary)' },
  CANCELADA: { backgroundColor: 'var(--border-light)', color: 'var(--text-secondary)' },
};

export const ESTILO_ATRASADA = { backgroundColor: '#fee2e2', color: '#991b1b' };
