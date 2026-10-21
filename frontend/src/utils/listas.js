export const TAMANO_PAGINA = 8;

// Minúsculas y sin tildes, para que "camara" encuentre "Cámara"
export function normalizar(texto) {
  return (texto ?? '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

// Devuelve solo los elementos de la página pedida (corrigiendo la página si quedó fuera de rango)
export function paginar(lista, pagina) {
  const totalPaginas = Math.max(1, Math.ceil(lista.length / TAMANO_PAGINA));
  const paginaActual = Math.min(Math.max(1, pagina), totalPaginas);
  const inicio = (paginaActual - 1) * TAMANO_PAGINA;
  return {
    visibles: lista.slice(inicio, inicio + TAMANO_PAGINA),
    paginaActual,
    totalPaginas,
  };
}
