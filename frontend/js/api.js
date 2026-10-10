/**
 * CINEVERSE / BMS API Client
 * Connects frontend directly to Spring Boot /api/v1 REST Endpoints
 */

const API_CONFIG = {
  defaultBackendUrl: 'http://localhost:8080',

  getBackendUrl() {
    const custom = localStorage.getItem('bms_backend_url');
    if (custom) return custom.replace(/\/+$/, '');
    if (typeof window !== 'undefined' && window.location.port === '8080') {
      return window.location.origin;
    }
    return this.defaultBackendUrl;
  },

  getApiBase() {
    if (typeof window !== 'undefined' && window.location.port === '8080') {
      return '/api/v1';
    }
    return `${this.getBackendUrl()}/api/v1`;
  },

  setBackendUrl(url) {
    if (url) {
      localStorage.setItem('bms_backend_url', url.replace(/\/+$/, ''));
    } else {
      localStorage.removeItem('bms_backend_url');
    }
  }
};

const API = {
  config: API_CONFIG,

  // Token & Auth Management
  getToken() {
    return localStorage.getItem('bms_token');
  },

  setSession(token, user) {
    localStorage.setItem('bms_token', token);
    localStorage.setItem('bms_user', JSON.stringify(user));
  },

  getUser() {
    try {
      const data = localStorage.getItem('bms_user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  clearSession() {
    localStorage.removeItem('bms_token');
    localStorage.removeItem('bms_user');
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  // Centralized Fetch Wrapper
  async request(endpoint, options = {}) {
    const url = `${API_CONFIG.getApiBase()}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });
      const text = await response.text();
      let data = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text };
        }
      }

      if (!response.ok) {
        const errorMsg = (data && (data.message || data.error)) || `HTTP Error ${response.status}`;
        throw new Error(errorMsg);
      }

      return data;
    } catch (err) {
      console.error(`API Error on ${url}:`, err);
      throw err;
    }
  },

  // Connection & Health check
  async checkHealth() {
    try {
      const url = `${API_CONFIG.getApiBase()}/movies`;
      const res = await fetch(url, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  },

  // --- Auth Endpoints ---
  auth: {
    login(credentials) {
      return API.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },

    register(userData) {
      return API.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },

    getAllUsers() {
      return API.request('/auth/users');
    },

    getUserById(id) {
      return API.request(`/auth/users/${id}`);
    },
  },

  // --- Movies Endpoints ---
  movies: {
    getAll() {
      return API.request('/movies');
    },

    getById(id) {
      return API.request(`/movies/${id}`);
    },

    getByGenre(genre) {
      return API.request(`/movies/genre/${encodeURIComponent(genre)}`);
    },

    getByLanguage(language) {
      return API.request(`/movies/language/${encodeURIComponent(language)}`);
    },

    search(title) {
      return API.request(`/movies/title/${encodeURIComponent(title)}`);
    },

    add(movieData) {
      return API.request('/movies', {
        method: 'POST',
        body: JSON.stringify(movieData),
      });
    },

    update(id, movieData) {
      return API.request(`/movies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(movieData),
      });
    },

    delete(id) {
      return API.request(`/movies/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // --- Cities Endpoints ---
  cities: {
    getAll() {
      return API.request('/cities');
    },

    getById(id) {
      return API.request(`/cities/${id}`);
    },

    add(cityData) {
      return API.request('/cities', {
        method: 'POST',
        body: JSON.stringify(cityData),
      });
    },
  },

  // --- Theaters Endpoints ---
  theaters: {
    getAll() {
      return API.request('/theaters');
    },

    getById(id) {
      return API.request(`/theaters/${id}`);
    },

    getByCity(cityId) {
      return API.request(`/theaters/city/${cityId}`);
    },

    add(theaterData) {
      return API.request('/theaters', {
        method: 'POST',
        body: JSON.stringify(theaterData),
      });
    },
  },

  // --- Screens Endpoints ---
  screens: {
    getAll() {
      return API.request('/screens');
    },

    getById(id) {
      return API.request(`/screens/${id}`);
    },

    getByTheater(theaterId) {
      return API.request(`/screens/theater/${theaterId}`);
    },

    add(screenData) {
      return API.request('/screens', {
        method: 'POST',
        body: JSON.stringify(screenData),
      });
    },
  },

  // --- Shows Endpoints ---
  shows: {
    getAll() {
      return API.request('/shows');
    },

    getById(id) {
      return API.request(`/shows/${id}`);
    },

    getByMovie(movieId) {
      return API.request(`/shows/movie/${movieId}`);
    },

    getByMovieAndDate(movieId, date) {
      return API.request(`/shows/movie/${movieId}/date?date=${date}`);
    },

    getByScreen(screenId) {
      return API.request(`/shows/screen/${screenId}`);
    },

    getByScreenAndDate(screenId, date) {
      return API.request(`/shows/screen/${screenId}/date?date=${date}`);
    },

    add(showData) {
      return API.request('/shows', {
        method: 'POST',
        body: JSON.stringify(showData),
      });
    },
  },

  // --- Bookings & Seats Endpoints ---
  bookings: {
    create(bookingData) {
      return API.request('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      });
    },

    getById(id) {
      return API.request(`/bookings/${id}`);
    },

    getByUser(userId) {
      return API.request(`/bookings/user/${userId}`);
    },

    getMyBookings() {
      return API.request('/bookings/my-bookings');
    },

    getByShow(showId) {
      return API.request(`/bookings/show/${showId}`);
    },

    cancel(bookingId) {
      return API.request(`/bookings/${bookingId}/cancel`, {
        method: 'PUT',
      });
    },

    getAvailableSeats(showId) {
      return API.request(`/bookings/show/${showId}/available-seats`);
    },

    getAll() {
      return API.request('/bookings');
    },
  },

  // --- Seats Endpoints ---
  seats: {
    getAll() {
      return API.request('/seats');
    },

    getById(id) {
      return API.request(`/seats/${id}`);
    },

    getByScreen(screenId) {
      return API.request(`/seats/screen/${screenId}`);
    },

    add(seatData) {
      return API.request('/seats', {
        method: 'POST',
        body: JSON.stringify(seatData),
      });
    },
  },
};
