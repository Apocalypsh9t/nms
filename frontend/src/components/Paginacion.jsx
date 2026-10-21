import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Paginacion({ pagina, totalPaginas, total, onCambiar }) {
  if (total === 0) return null;

  return (
    <div
      className="flex-between"
      style={{ padding: '0.9rem 1.5rem', borderTop: '1px solid var(--border-light)', flexWrap: 'wrap', gap: '0.75rem' }}
    >
      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        {total} {total === 1 ? 'resultado' : 'resultados'}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          className="btn btn-outline"
          style={{ padding: '0.35rem 0.6rem' }}
          disabled={pagina <= 1}
          onClick={() => onCambiar(pagina - 1)}
          title="Página anterior"
        >
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Página {pagina} de {totalPaginas}
        </span>
        <button
          className="btn btn-outline"
          style={{ padding: '0.35rem 0.6rem' }}
          disabled={pagina >= totalPaginas}
          onClick={() => onCambiar(pagina + 1)}
          title="Página siguiente"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
