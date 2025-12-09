// Configuração da API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/v1/auth/login`,
    REFRESH: `${API_BASE_URL}/api/v1/auth/refresh`,
  },
  USERS: {
    LIST: `${API_BASE_URL}/api/v1/users`,
    GET: (id: number) => `${API_BASE_URL}/api/v1/users/${id}`,
    CREATE: `${API_BASE_URL}/api/v1/users`,
    UPDATE: (id: number) => `${API_BASE_URL}/api/v1/users/${id}`,
    DELETE: (id: number) => `${API_BASE_URL}/api/v1/users/${id}`,
  },
  VEHICLES: {
    LIST: `${API_BASE_URL}/api/v1/vehicles`,
    CREATE: `${API_BASE_URL}/api/v1/vehicles`,
    UPDATE: (id: number) => `${API_BASE_URL}/api/v1/vehicles/${id}`,
    STATUS: (id: number) => `${API_BASE_URL}/api/v1/vehicles/${id}/status`,
  },
  ROUTES: {
    LIST: `${API_BASE_URL}/api/v1/routes`,
    GET: (id: number) => `${API_BASE_URL}/api/v1/routes/${id}`,
    CREATE: `${API_BASE_URL}/api/v1/routes`,
    UPDATE: (id: number) => `${API_BASE_URL}/api/v1/routes/${id}`,
    ADD_POINT: (id: number) => `${API_BASE_URL}/api/v1/routes/${id}/points`,
    REORDER_POINTS: (id: number) => `${API_BASE_URL}/api/v1/routes/${id}/points/reorder`,
    MAP: {
      IMPORT_GEOJSON: `${API_BASE_URL}/api/v1/routes/map/import-geojson`,
      GET_GEO: `${API_BASE_URL}/api/v1/routes/map/geo`,
      GET_ROUTE_MAP: (id: number) => `${API_BASE_URL}/api/v1/routes/${id}/map`,
    },
  },
  ASSIGNMENTS: {
    LIST: `${API_BASE_URL}/api/v1/assignments`,
    GET: (id: number) => `${API_BASE_URL}/api/v1/assignments/${id}`,
    CREATE: `${API_BASE_URL}/api/v1/assignments`,
    UPDATE: (id: number) => `${API_BASE_URL}/api/v1/assignments/${id}`,
    DEACTIVATE: (id: number) => `${API_BASE_URL}/api/v1/assignments/${id}/deactivate`,
  },
  EXECUTIONS: {
    LIST: `${API_BASE_URL}/api/v1/executions`,
    GET: (id: number) => `${API_BASE_URL}/api/v1/executions/${id}`,
    START: `${API_BASE_URL}/api/v1/executions/start`,
    COMPLETE: (id: number) => `${API_BASE_URL}/api/v1/executions/${id}/complete`,
    CANCEL: (id: number) => `${API_BASE_URL}/api/v1/executions/${id}/cancel`,
    GPS: (id: number) => `${API_BASE_URL}/api/v1/executions/${id}/gps`,
    GPS_BATCH: (id: number) => `${API_BASE_URL}/api/v1/executions/${id}/gps/batch`,
  },
};

export default API_BASE_URL;

