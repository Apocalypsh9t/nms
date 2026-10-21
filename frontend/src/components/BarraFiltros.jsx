import { Search } from 'lucide-react';

// Caja de búsqueda; los filtros extra (selects) se pasan como children
export default function BarraFiltros({ busqueda, onBusqueda, placeholder, children }) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flex: '1 1 240px' }}>
        <Search
          size={16}
          style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}
        />
        <input
          type="search"
          className="form-input"
          style={{ paddingLeft: '2.25rem' }}
          placeholder={placeholder}
          value={busqueda}
          onChange={(e) => onBusqueda(e.target.value)}
        />
      </div>
      {children}
    </div>
  );
}
