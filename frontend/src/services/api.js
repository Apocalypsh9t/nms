import axios from 'axios';

// En desarrollo local usa localhost; en producción, definir VITE_API_URL al desplegar
// (ver .env.example) apuntando a la URL real del backend.
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8085/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// El backend ya no recibe el id del usuario por parámetro: se identifica con el token
// que se guarda al iniciar sesión, mandado en cada pedido.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cosmo_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function limpiarSesionYRedirigir() {
  localStorage.removeItem('cosmo_token');
  localStorage.removeItem('cosmo_refresh_token');
  localStorage.removeItem('cosmo_user');
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

// El access token dura poco (30 min) a propósito. Cuando vence, en vez de mandar al
// usuario al login de una vez, se intenta renovar solo con el refresh token guardado;
// si eso también falla (o no hay refresh token), ahí sí se cierra la sesión.
// refreshEnCurso evita pedir varios refresh en paralelo si varias peticiones fallan a la vez.
let refreshEnCurso = null;

function pedirNuevoAccessToken() {
  if (!refreshEnCurso) {
    const refreshToken = localStorage.getItem('cosmo_refresh_token');
    if (!refreshToken) {
      refreshEnCurso = Promise.reject(new Error('No hay refresh token'));
    } else {
      refreshEnCurso = axios
        .post(`${baseURL}/usuarios/refresh`, { refreshToken })
        .then((res) => {
          localStorage.setItem('cosmo_token', res.data.token);
          localStorage.setItem('cosmo_refresh_token', res.data.refreshToken);
          localStorage.setItem('cosmo_user', JSON.stringify(res.data.usuario));
          return res.data.token;
        })
        .finally(() => {
          refreshEnCurso = null;
        });
    }
  }
  return refreshEnCurso;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error?.config;
    const esLoginORefresh = request?.url?.includes('/usuarios/login') || request?.url?.includes('/usuarios/refresh');

    if (error?.response?.status === 401 && request && !request._reintentado && !esLoginORefresh) {
      request._reintentado = true;
      try {
        const nuevoToken = await pedirNuevoAccessToken();
        request.headers.Authorization = `Bearer ${nuevoToken}`;
        return api(request);
      } catch {
        limpiarSesionYRedirigir();
        return Promise.reject(error);
      }
    }

    if (error?.response?.status === 401) {
      limpiarSesionYRedirigir();
    }
    return Promise.reject(error);
  }
);

// El backend responde los errores como { codigoEstado, mensaje, marcaDeTiempo }
export function getErrorMessage(error, fallback) {
  return error?.response?.data?.mensaje || fallback;
}

export default api;
