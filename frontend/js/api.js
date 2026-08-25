// API Module
const API = {
  baseUrl: '/api',

  getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  },

  async request(method, endpoint, body = null, isBlob = false) {
    try {
      const config = { method, headers: this.getHeaders() };
      if (body && method !== 'GET') {
        config.body = JSON.stringify(body);
      }
      // Strip /api prefix if baseUrl already includes it to avoid double prefix
      const path = endpoint.startsWith('/api') ? endpoint.slice(4) : endpoint;
      const response = await fetch(`${this.baseUrl}${path}`, config);

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/html/login.html';
        return null;
      }

      if (isBlob) {
        if (!response.ok) throw new Error('Error al descargar');
        return response.blob();
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.errors?.map(e => e.message).join(', ') || 'Error del servidor');
      }
      return data;
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Error de conexión con el servidor');
      }
      throw error;
    }
  },

  get(endpoint) { return this.request('GET', endpoint); },
  post(endpoint, body) { return this.request('POST', endpoint, body); },
  put(endpoint, body) { return this.request('PUT', endpoint, body); },
  delete(endpoint) { return this.request('DELETE', endpoint); },

  async download(endpoint) {
    return this.request('GET', endpoint, null, true);
  }
};

/* Exponer para otros módulos y vistas (SPA) */
window.API = API;
