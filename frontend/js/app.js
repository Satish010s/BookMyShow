/**
 * CINEVERSE / BMS Frontend Application Engine
 * Pure Authentic Data Version — Connects directly to Spring Boot Backend
 */

const state = {
  movies: [],
  filteredMovies: [],
  cities: [],
  selectedCityId: null,
  selectedMovie: null,
  movieShows: [],
  selectedShow: null,
  selectedDate: null,
  availableSeats: [],
  selectedSeatIds: new Set(),
  activeView: 'home',
  activeGenre: 'ALL',
};

// ==========================================================================
// TOAST NOTIFICATIONS
// ==========================================================================
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let icon = '✓';
  if (type === 'error') icon = '✕';
  if (type === 'info') icon = 'ℹ';

  toast.innerHTML = `<strong>${icon}</strong> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ==========================================================================
// BACKEND CONNECTIVITY CHECKER
// ==========================================================================
async function checkBackendConnectivity() {
  const badge = document.getElementById('backend-status-badge');
  const backendUrl = API.config.getBackendUrl();

  try {
    const isOnline = await API.checkHealth();
    if (badge) {
      if (isOnline) {
        badge.innerHTML = `<span class="badge-dot" style="color: #10b981;">●</span> <span class="badge-text">API Online</span>`;
        badge.className = 'backend-badge online';
        badge.title = `Connected to Spring Boot backend at ${backendUrl} (click to refresh)`;
      } else {
        badge.innerHTML = `<span class="badge-dot" style="color: #ef4444;">●</span> <span class="badge-text">API Offline</span>`;
        badge.className = 'backend-badge offline';
        badge.title = `Spring Boot backend is unreachable at ${backendUrl}. Ensure backend is running.`;
      }
    }
  } catch {
    if (badge) {
      badge.innerHTML = `<span class="badge-dot" style="color: #ef4444;">●</span> <span class="badge-text">API Offline</span>`;
      badge.className = 'backend-badge offline';
      badge.title = `Spring Boot backend is unreachable at ${backendUrl}. Click to retry.`;
    }
  }
}

// ==========================================================================
// VIEW ROUTER
// ==========================================================================
function showView(viewName) {
  state.activeView = viewName;
  document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));

  const target = document.getElementById(`view-${viewName}`);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Update Nav Link Active States
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.dataset.view === viewName) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// ==========================================================================
// AUTHENTICATION & SESSION UI
// ==========================================================================
function updateAuthUI() {
  const authBtn = document.getElementById('auth-action-btn');
  const userMenu = document.getElementById('user-menu');
  const adminNav = document.getElementById('nav-admin-link');
  const managerNav = document.getElementById('nav-manager-link');
  const roleBadge = document.getElementById('user-role-badge');
  const user = API.getUser();

  if (API.isAuthenticated() && user) {
    if (authBtn) authBtn.style.display = 'none';
    if (userMenu) {
      userMenu.style.display = 'inline-flex';
      const nameEl = document.getElementById('user-display-name');
      const avatarEl = document.getElementById('user-avatar');
      if (nameEl) nameEl.textContent = user.name || user.email.split('@')[0];
      if (avatarEl) avatarEl.textContent = (user.name || user.email)[0].toUpperCase();
      if (roleBadge) {
        const r = (user.role || 'USER').toUpperCase();
        roleBadge.textContent = r;
        roleBadge.className = `dash-badge ${r.toLowerCase()}`;
      }
    }

    const role = (user.role || '').toUpperCase();
    if (adminNav) {
      adminNav.style.display = (role === 'ADMIN') ? 'inline-flex' : 'none';
    }
    if (managerNav) {
      managerNav.style.display = (role === 'ADMIN' || role === 'MANAGER') ? 'inline-flex' : 'none';
    }
  } else {
    if (authBtn) authBtn.style.display = 'inline-flex';
    if (userMenu) userMenu.style.display = 'none';
    if (adminNav) adminNav.style.display = 'none';
    if (managerNav) managerNav.style.display = 'none';
  }
}

function openAuthModal(tab = 'login') {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.add('open');
  switchAuthTab(tab);
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.remove('open');
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById('login-form');
  const regForm = document.getElementById('register-form');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');

  if (tab === 'login') {
    loginForm.style.display = 'block';
    regForm.style.display = 'none';
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
  } else {
    loginForm.style.display = 'none';
    regForm.style.display = 'block';
    tabLogin.classList.remove('active');
    tabRegister.classList.add('active');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    const res = await API.auth.login({ email, password });
    API.setSession(res.token, {
      userId: res.userId,
      email: res.email,
      role: res.role,
      name: res.name || res.email.split('@')[0]
    });
    showToast(`Welcome back, ${res.email}! (${res.role})`, 'success');
    closeAuthModal();
    updateAuthUI();

    if (state.activeView === 'seat-booking' && state.selectedSeatIds.size > 0) {
      updateSummaryCard();
    }
  } catch (err) {
    showToast(err.message || 'Login failed. Please verify credentials.', 'error');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const phone = document.getElementById('reg-phone').value.trim();
  const role = document.getElementById('reg-role').value;

  try {
    const res = await API.auth.register({ name, email, password, phone, role });
    API.setSession(res.token, {
      userId: res.userId,
      name: name,
      email: res.email,
      role: res.role
    });
    showToast('Registration successful! You are now logged in.', 'success');
    closeAuthModal();
    updateAuthUI();
  } catch (err) {
    showToast(err.message || 'Registration failed.', 'error');
  }
}

function handleLogout() {
  API.clearSession();
  updateAuthUI();
  showToast('Logged out successfully', 'info');
  showView('home');
}

// ==========================================================================
// CITIES & INITIALIZATION
// ==========================================================================
async function loadCities() {
  try {
    const cities = await API.cities.getAll();
    state.cities = cities || [];
    const select = document.getElementById('city-select');
    if (!select) return;

    select.innerHTML = '<option value="">📍 All Cities</option>';
    (state.cities || []).forEach(city => {
      const opt = document.createElement('option');
      opt.value = city.id;
      opt.textContent = `${city.name} (${city.state})`;
      select.appendChild(opt);
    });

    select.addEventListener('change', (e) => {
      state.selectedCityId = e.target.value ? Number(e.target.value) : null;
      if (state.selectedMovie) {
        renderFilteredShows();
      }
    });
  } catch (err) {
    console.error('Error loading cities from database:', err);
  }
}

// ==========================================================================
// MOVIES DISPLAY & FILTERING (AUTHENTIC DATA ONLY)
// ==========================================================================
async function loadMovies() {
  const grid = document.getElementById('movie-grid');
  if (grid) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <div class="loading-spinner"></div>
        <p style="margin-top: 16px;">Loading authentic movies from database...</p>
      </div>
    `;
  }

  try {
    const movies = await API.movies.getAll();
    state.movies = movies || [];
    state.filteredMovies = movies || [];

    // Dynamically render genre filter pills based on movies in DB
    renderGenreFilters(state.movies);
    renderMovieGrid(state.filteredMovies);
    populateMovieDropdown(state.movies);

    if (state.movies.length > 0) {
      renderHeroBanner(state.movies[0]);
    } else {
      renderEmptyHeroBanner();
    }
  } catch (err) {
    console.error('Could not load movies from API:', err);
    showToast('Could not load movies. Please check if Spring Boot is running on port 8080.', 'error');
    if (grid) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #f87171;">
          <h3>Connection Error</h3>
          <p>Could not connect to Spring Boot backend at <code>${API.config.getBackendUrl()}</code>.</p>
          <button class="btn btn-secondary btn-sm" style="margin-top: 14px;" onclick="loadMovies()">Retry Connection</button>
        </div>
      `;
    }
  }
}

function renderGenreFilters(movies) {
  const container = document.getElementById('genre-filter-container');
  if (!container) return;

  const genres = Array.from(new Set(movies.map(m => m.genre).filter(Boolean))).sort();

  let html = `<button class="filter-pill ${state.activeGenre === 'ALL' ? 'active' : ''}" data-genre="ALL" onclick="filterByGenre('ALL')">All Movies (${movies.length})</button>`;
  genres.forEach(g => {
    const count = movies.filter(m => m.genre === g).length;
    html += `<button class="filter-pill ${state.activeGenre === g ? 'active' : ''}" data-genre="${g}" onclick="filterByGenre('${g}')">${g} (${count})</button>`;
  });

  container.innerHTML = html;
}

function populateMovieDropdown(movies) {
  const select = document.getElementById('movie-select');
  if (!select) return;

  select.innerHTML = '<option value="">All Movies</option>';
  (movies || []).forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = `${m.title} (${m.language || 'Cinema'})`;
    select.appendChild(opt);
  });

  select.onchange = (e) => {
    const selectedId = e.target.value ? Number(e.target.value) : null;
    if (!selectedId) {
      state.filteredMovies = state.movies;
      renderMovieGrid(state.filteredMovies);
    } else {
      openMovieDetails(selectedId);
    }
  };
}

function renderHeroBanner(movie) {
  const banner = document.getElementById('hero-banner');
  if (!banner || !movie) return;

  if (movie.posterUrl) {
    banner.style.backgroundImage = `linear-gradient(180deg, rgba(15, 19, 29, 0.55), rgba(7, 9, 14, 0.95)), url('${movie.posterUrl}')`;
    banner.style.backgroundSize = 'cover';
    banner.style.backgroundPosition = 'center';
  } else {
    banner.style.backgroundImage = 'linear-gradient(135deg, rgba(30, 27, 75, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)';
  }

  const titleEl = document.getElementById('hero-title');
  const metaEl = document.getElementById('hero-meta');
  const descEl = document.getElementById('hero-desc');
  const bookBtn = document.getElementById('hero-book-btn');

  if (titleEl) titleEl.textContent = movie.title;
  if (metaEl) {
    metaEl.innerHTML = `
      <span>⭐ <strong class="rating-star">${movie.rating ? movie.rating.toFixed(1) : 'N/A'}/10</strong></span>
      <span>•</span>
      <span>${movie.genre || 'Cinema'}</span>
      <span>•</span>
      <span>${movie.durationMinutes ? movie.durationMinutes + ' min' : 'Feature Film'}</span>
      <span>•</span>
      <span>${movie.language || 'Language'}</span>
    `;
  }
  if (descEl) descEl.textContent = movie.description || 'Authentic movie listing from database. Book your seats now.';
  if (bookBtn) {
    bookBtn.onclick = () => openMovieDetails(movie.id);
  }
}

function renderEmptyHeroBanner() {
  const banner = document.getElementById('hero-banner');
  if (!banner) return;
  banner.style.backgroundImage = 'linear-gradient(135deg, rgba(30, 27, 75, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)';
  const titleEl = document.getElementById('hero-title');
  const metaEl = document.getElementById('hero-meta');
  const descEl = document.getElementById('hero-desc');
  if (titleEl) titleEl.textContent = 'Welcome to CineVerse';
  if (metaEl) metaEl.innerHTML = '<span>Ready to browse database movies</span>';
  if (descEl) descEl.textContent = 'Add movies via Admin Center or Manager Hub to start selling tickets.';
}

function renderMovieGrid(movies) {
  const grid = document.getElementById('movie-grid');
  if (!grid) return;

  if (!movies || movies.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <h3>No movies found in database</h3>
        <p>No titles matched your criteria or database contains no listings.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = movies.map(movie => `
    <div class="movie-card" onclick="openMovieDetails(${movie.id})">
      <div class="movie-poster-wrap">
        ${movie.posterUrl 
          ? `<img class="movie-poster" src="${movie.posterUrl}" alt="${movie.title}" loading="lazy" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';" />
             <div class="movie-poster-fallback" style="display: none;">🎬</div>`
          : `<div class="movie-poster-fallback" style="display: flex;">🎬</div>`
        }
        <div class="movie-rating-badge">
          ★ ${movie.rating ? movie.rating.toFixed(1) : 'N/A'}
        </div>
        <div class="movie-lang-badge">
          ${movie.language || 'LANG'}
        </div>
      </div>
      <div class="movie-info">
        <div class="movie-title" title="${movie.title}">${movie.title}</div>
        <div class="movie-tags">
          <span>${movie.genre || 'Cinema'}</span>
          <span>•</span>
          <span>${movie.durationMinutes ? movie.durationMinutes + 'm' : ''}</span>
        </div>
        <button class="btn btn-primary btn-sm movie-card-btn">Book Tickets</button>
      </div>
    </div>
  `).join('');
}

function filterByGenre(genre) {
  state.activeGenre = genre;
  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.genre === genre);
  });

  if (genre === 'ALL') {
    state.filteredMovies = state.movies;
  } else {
    state.filteredMovies = state.movies.filter(m =>
      (m.genre || '').toLowerCase() === genre.toLowerCase()
    );
  }
  renderMovieGrid(state.filteredMovies);
}

function handleSearch(query) {
  const q = (query || '').toLowerCase().trim();
  const clearBtn = document.getElementById('search-clear-btn');
  if (clearBtn) {
    clearBtn.style.display = q ? 'block' : 'none';
  }

  // Ensure user is seeing the home view where movies are displayed
  if (q && state.currentView !== 'home') {
    showView('home');
  }

  if (!q) {
    hideSearchDropdown();
    filterByGenre(state.activeGenre || 'ALL');
    return;
  }

  const results = (state.movies || []).filter(m => {
    const title = (m.title || '').toLowerCase();
    const genre = (m.genre || '').toLowerCase();
    const lang = (m.language || '').toLowerCase();
    const desc = (m.description || '').toLowerCase();
    return title.includes(q) || genre.includes(q) || lang.includes(q) || desc.includes(q);
  });

  renderMovieGrid(results);
  renderSearchDropdown(results, q);
}

function renderSearchDropdown(matches, query) {
  const dropdown = document.getElementById('search-results-dropdown');
  if (!dropdown) return;

  if (!matches || matches.length === 0) {
    dropdown.innerHTML = `
      <div class="search-empty-state">
        No movies matching "<strong>${escapeHtml(query)}</strong>" found.<br>
        <button class="btn btn-secondary btn-sm" style="margin-top: 8px;" onclick="clearSearch()">Clear Search</button>
      </div>
    `;
    dropdown.classList.add('open');
    return;
  }

  dropdown.innerHTML = matches.slice(0, 5).map(m => `
    <div class="search-result-item" onclick="selectSearchResult(${m.id})">
      ${m.posterUrl
        ? `<img class="search-result-poster" src="${escapeHtml(m.posterUrl)}" alt="${escapeHtml(m.title)}" onerror="this.onerror=null; this.style.display='none';" />`
        : `<div class="search-result-poster" style="display:flex;align-items:center;justify-content:center;font-size:0.75rem;color:var(--text-dim);background:#1e293b;">FILM</div>`
      }
      <div class="search-result-info">
        <div class="search-result-title">${escapeHtml(m.title)}</div>
        <div class="search-result-sub">
          <span>${escapeHtml(m.genre || 'Cinema')}</span>
          <span>•</span>
          <span>${escapeHtml(m.language || 'Language')}</span>
          <span>•</span>
          <span style="color: var(--accent-gold);">★ ${m.rating ? m.rating.toFixed(1) : 'N/A'}</span>
        </div>
      </div>
    </div>
  `).join('');

  dropdown.classList.add('open');
}

function hideSearchDropdown() {
  const dropdown = document.getElementById('search-results-dropdown');
  if (dropdown) dropdown.classList.remove('open');
}

function selectSearchResult(movieId) {
  hideSearchDropdown();
  const input = document.getElementById('movie-search-input');
  if (input) input.value = '';
  const clearBtn = document.getElementById('search-clear-btn');
  if (clearBtn) clearBtn.style.display = 'none';
  openMovieDetails(movieId);
}

function clearSearch() {
  const input = document.getElementById('movie-search-input');
  if (input) {
    input.value = '';
    input.focus();
  }
  handleSearch('');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ==========================================================================
// SHOWS & THEATER VIEW (AUTHENTIC DATABASE SHOWS)
// ==========================================================================
async function openMovieDetails(movieId) {
  try {
    const movie = await API.movies.getById(movieId);
    state.selectedMovie = movie;

    // Render Movie Details Header
    const banner = document.getElementById('movie-details-banner');
    if (banner) {
      banner.innerHTML = `
        ${movie.posterUrl
          ? `<img class="selected-movie-poster" src="${movie.posterUrl}" alt="${movie.title}" />`
          : `<div class="selected-movie-poster" style="display: flex; align-items: center; justify-content: center; font-size: 3rem; background: #1e293b;">🎬</div>`
        }
        <div style="flex: 1;">
          <h2 style="font-size: 2rem; margin-bottom: 8px;">${movie.title}</h2>
          <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center; color: var(--text-muted); font-size: 0.9rem; margin-bottom: 14px;">
            <span>⭐ <strong style="color: var(--accent-gold);">${movie.rating ? movie.rating.toFixed(1) : 'N/A'}/10</strong></span>
            <span>•</span>
            <span>${movie.genre || 'Cinema'}</span>
            <span>•</span>
            <span>${movie.language || 'Language'}</span>
            <span>•</span>
            <span>${movie.durationMinutes || 120} minutes</span>
          </div>
          <p style="color: #cbd5e1; font-size: 0.95rem; line-height: 1.6; max-width: 800px;">
            ${movie.description || 'Select an authentic theater and showtime below to choose your favorite seats.'}
          </p>
        </div>
      `;
    }

    // Fetch all authentic shows for this movie from DB
    await loadShowsForMovie(movieId);
    showView('movie-details');
  } catch (err) {
    showToast('Failed to load movie details: ' + err.message, 'error');
  }
}

async function loadShowsForMovie(movieId) {
  const container = document.getElementById('shows-container');
  if (container) {
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted);">Fetching showtimes from database...</div>';
  }

  try {
    const shows = await API.shows.getByMovie(movieId);
    state.movieShows = shows || [];

    // Extract unique show dates from actual database shows
    const uniqueDates = Array.from(new Set(state.movieShows.map(s => s.showDate).filter(Boolean))).sort();

    if (uniqueDates.length > 0) {
      // Pick the latest available date or today's date if present
      const todayIso = new Date().toISOString().split('T')[0];
      if (uniqueDates.includes(todayIso)) {
        state.selectedDate = todayIso;
      } else {
        state.selectedDate = uniqueDates[uniqueDates.length - 1];
      }
      renderDateSelector(uniqueDates);
      renderFilteredShows();
    } else {
      renderDateSelector([]);
      if (container) {
        container.innerHTML = `
          <div class="theater-card" style="text-align: center; padding: 48px 20px;">
            <h3 style="margin-bottom: 8px;">No shows scheduled in database</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem;">
              There are currently no active screenings in the database for <strong>${state.selectedMovie.title}</strong>.
            </p>
          </div>
        `;
      }
    }
  } catch (err) {
    if (container) {
      container.innerHTML = `
        <div class="theater-card" style="color: #f87171; text-align: center; padding: 30px;">
          Error loading shows from database: ${err.message}
        </div>
      `;
    }
  }
}

function renderDateSelector(availableDates = []) {
  const container = document.getElementById('date-selector-bar');
  if (!container) return;

  if (availableDates.length === 0) {
    container.innerHTML = '<div style="color: var(--text-muted); padding: 10px 0;">No dates with scheduled shows in database.</div>';
    return;
  }

  container.innerHTML = availableDates.map((dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const isActive = dateStr === state.selectedDate;

    return `
      <div class="date-pill ${isActive ? 'active' : ''}" onclick="selectDate('${dateStr}')">
        <div class="day-name">${dayName}</div>
        <div class="day-number">${dayNum}</div>
        <div style="font-size: 0.72rem; color: var(--text-dim); text-transform: uppercase;">${month}</div>
      </div>
    `;
  }).join('');
}

function selectDate(dateIso) {
  state.selectedDate = dateIso;
  const uniqueDates = Array.from(new Set(state.movieShows.map(s => s.showDate).filter(Boolean))).sort();
  renderDateSelector(uniqueDates);
  renderFilteredShows();
}

function renderFilteredShows() {
  const container = document.getElementById('shows-container');
  if (!container) return;

  // Filter shows by selected date
  let filtered = state.movieShows.filter(s => s.showDate === state.selectedDate);

  // Filter by city if selected
  if (state.selectedCityId) {
    filtered = filtered.filter(s => {
      // Find matching theater in city
      return s.cityName && state.cities.some(c => c.id === state.selectedCityId && c.name.toLowerCase() === s.cityName.toLowerCase());
    });
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="theater-card" style="text-align: center; padding: 48px 20px;">
        <h3 style="margin-bottom: 8px;">No shows scheduled for this date / city</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem;">
          Please choose another date or reset the city filter.
        </p>
      </div>
    `;
    return;
  }

  // Group shows by Theater
  const theaterMap = new Map();
  filtered.forEach(show => {
    const theaterName = show.theaterName || show.theatreName || 'Theater';
    if (!theaterMap.has(theaterName)) {
      theaterMap.set(theaterName, []);
    }
    theaterMap.get(theaterName).push(show);
  });

  container.innerHTML = Array.from(theaterMap.entries()).map(([theaterName, showList]) => `
    <div class="theater-card">
      <div class="theater-header">
        <div>
          <div class="theater-name">${theaterName}</div>
          <div class="theater-address">${showList[0].cityName || 'Cinema Hall'}</div>
        </div>
        <span style="font-size: 0.8rem; color: var(--accent-emerald); font-weight: 600;">● M-Ticket Available</span>
      </div>
      <div class="showtimes-grid">
        ${showList.map(s => {
          const timeStr = s.startTime ? s.startTime.substring(0, 5) : 'Showtime';
          return `
            <div class="showtime-pill" onclick='selectShowForBooking(${JSON.stringify(s)})'>
              <div class="time">${timeStr}</div>
              <div class="screen-type">${s.screenName || 'Screen'}</div>
              <div style="font-size: 0.72rem; color: var(--accent-gold); margin-top: 2px;">₹${s.ticketPrice || 250}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `).join('');
}

// ==========================================================================
// SEAT BOOKING SELECTION (REAL DATABASE SEATS & AVAILABILITY)
// ==========================================================================
async function selectShowForBooking(show) {
  state.selectedShow = show;
  state.selectedSeatIds.clear();

  const titleEl = document.getElementById('seat-booking-movie-title');
  const metaEl = document.getElementById('seat-booking-meta');
  if (titleEl) titleEl.textContent = show.movieTitle || (state.selectedMovie ? state.selectedMovie.title : 'Movie');
  if (metaEl) {
    const timeStr = show.startTime ? show.startTime.substring(0, 5) : '';
    const theaterName = show.theaterName || show.theatreName || 'Theater';
    metaEl.textContent = `${theaterName} • ${show.screenName || 'Screen'} • ${show.showDate} at ${timeStr}`;
  }

  showView('seat-booking');
  await loadSeatLayout(show.id, show.screenId);
  updateSummaryCard();
}

async function loadSeatLayout(showId, screenId) {
  const container = document.getElementById('seat-grid-container');
  if (!container) return;

  container.innerHTML = '<div style="color: var(--text-muted); padding: 40px;">Fetching live seat layout from database...</div>';

  try {
    // 1. Fetch available seats for this specific show from DB
    const availableSeats = await API.bookings.getAvailableSeats(showId);
    state.availableSeats = availableSeats || [];
    const availableIds = new Set(state.availableSeats.map(s => s.id));

    // 2. Fetch all configured seats for the screen to show both booked and available
    let allSeats = [];
    try {
      allSeats = await API.seats.getByScreen(screenId);
    } catch {
      allSeats = state.availableSeats;
    }

    if (!allSeats || allSeats.length === 0) {
      allSeats = state.availableSeats;
    }

    if (!allSeats || allSeats.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
          No seats configured in database for this screen.
        </div>
      `;
      return;
    }

    // Group seats by Row
    const rowMap = new Map();
    allSeats.forEach(seat => {
      const row = seat.row || (seat.seatNumber ? seat.seatNumber[0] : 'A');
      if (!rowMap.has(row)) {
        rowMap.set(row, []);
      }
      rowMap.get(row).push(seat);
    });

    // Sort rows alphabetically and cols numerically
    const sortedRows = Array.from(rowMap.keys()).sort();

    container.innerHTML = sortedRows.map(rowLetter => {
      const seatsInRow = rowMap.get(rowLetter).sort((a, b) => (a.col || 0) - (b.col || 0));

      return `
        <div class="seat-row">
          <div class="row-label">${rowLetter}</div>
          ${seatsInRow.map(seat => {
            const isAvailable = availableIds.has(seat.id);
            const isSelected = state.selectedSeatIds.has(seat.id);
            const seatClass = isSelected ? 'selected' : (isAvailable ? `available ${seat.seatType || 'REGULAR'}` : 'booked');

            return `
              <div class="seat ${seatClass}" 
                   title="${seat.seatNumber} (${seat.seatType || 'REGULAR'}) - ₹${seat.price || state.selectedShow?.ticketPrice || 250}"
                   ${isAvailable ? `onclick="toggleSeat(${seat.id})"` : ''}>
                ${seat.col || seat.seatNumber}
              </div>
            `;
          }).join('')}
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `
      <div style="color: #f87171; text-align: center; padding: 30px;">
        Failed to load seat layout from database: ${err.message}
      </div>
    `;
  }
}

function toggleSeat(seatId) {
  if (state.selectedSeatIds.has(seatId)) {
    state.selectedSeatIds.delete(seatId);
  } else {
    state.selectedSeatIds.add(seatId);
  }

  // Update UI styles
  document.querySelectorAll('.seat').forEach(el => {
    const seatObj = state.availableSeats.find(s => s.id === seatId);
    if (el.getAttribute('onclick')?.includes(`toggleSeat(${seatId})`)) {
      if (state.selectedSeatIds.has(seatId)) {
        el.className = 'seat selected';
      } else {
        el.className = `seat available ${seatObj?.seatType || 'REGULAR'}`;
      }
    }
  });

  updateSummaryCard();
}

function updateSummaryCard() {
  const chipContainer = document.getElementById('selected-seats-chip-container');
  const countEl = document.getElementById('summary-seat-count');
  const baseEl = document.getElementById('summary-base-price');
  const totalEl = document.getElementById('summary-total-price');
  const bookBtn = document.getElementById('confirm-booking-btn');

  const selectedSeats = state.availableSeats.filter(s => state.selectedSeatIds.has(s.id));
  const count = selectedSeats.length;

  let total = 0;
  selectedSeats.forEach(s => {
    total += s.price || (state.selectedShow ? state.selectedShow.ticketPrice : 250);
  });

  if (countEl) countEl.textContent = count;
  if (baseEl) baseEl.textContent = `₹${total.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `₹${total.toFixed(2)}`;

  if (chipContainer) {
    if (count === 0) {
      chipContainer.innerHTML = '<span style="color: var(--text-dim); font-size: 0.85rem;">No seats selected yet</span>';
    } else {
      chipContainer.innerHTML = selectedSeats.map(s => `
        <span class="selected-seat-chip">
          ${s.seatNumber} (${s.seatType})
          <span style="cursor: pointer; margin-left: 4px;" onclick="toggleSeat(${s.id})">✕</span>
        </span>
      `).join('');
    }
  }

  if (bookBtn) {
    if (count === 0) {
      bookBtn.disabled = true;
      bookBtn.textContent = 'Select Seats to Proceed';
    } else if (!API.isAuthenticated()) {
      bookBtn.disabled = false;
      bookBtn.textContent = `Sign In to Book (${count} Seats — ₹${total.toFixed(2)})`;
    } else {
      bookBtn.disabled = false;
      bookBtn.textContent = `Confirm Booking (${count} Seats — ₹${total.toFixed(2)})`;
    }
  }
}

async function handleConfirmBooking() {
  if (!API.isAuthenticated()) {
    openAuthModal('login');
    return;
  }

  if (state.selectedSeatIds.size === 0) {
    showToast('Please select at least one seat', 'error');
    return;
  }

  const btn = document.getElementById('confirm-booking-btn');
  if (btn) btn.disabled = true;

  try {
    const payload = {
      showId: state.selectedShow.id,
      seatIds: Array.from(state.selectedSeatIds),
    };

    const bookingRes = await API.bookings.create(payload);
    showToast('Tickets confirmed! Saved to database.', 'success');
    showTicketConfirmationModal(bookingRes);

    // Refresh seat map
    await loadSeatLayout(state.selectedShow.id, state.selectedShow.screenId);
    state.selectedSeatIds.clear();
    updateSummaryCard();
  } catch (err) {
    showToast(err.message || 'Failed to complete booking', 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

function showTicketConfirmationModal(booking) {
  const modal = document.getElementById('ticket-modal');
  const content = document.getElementById('ticket-details-content');
  if (!modal || !content) return;

  const seatsText = (booking.seats || []).map(s => s.seatNumber).join(', ');
  const timeFormatted = booking.showStartTime ? new Date(booking.showStartTime).toLocaleString() : '';

  content.innerHTML = `
    <div style="text-align: center; padding: 10px;">
      <div style="font-size: 3rem; margin-bottom: 10px;">🎟️</div>
      <h2 style="color: var(--accent-emerald); margin-bottom: 4px;">Booking Confirmed!</h2>
      <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 24px;">
        Booking Reference #${booking.bookingId} • Recorded in Database
      </p>

      <div style="background: var(--bg-surface-elevated); border: 1px dashed var(--border-subtle); border-radius: var(--radius-md); padding: 20px; text-align: left; margin-bottom: 24px;">
        <div style="font-size: 1.25rem; font-weight: 700; margin-bottom: 6px;">${booking.movieTitle || 'Movie'}</div>
        <div style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 12px;">
          ${booking.theatreName || booking.theaterName || 'Theater'} | ${booking.screenName || 'Screen'}
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.85rem; border-top: 1px solid var(--border-subtle); padding-top: 12px;">
          <div>
            <span style="color: var(--text-dim);">Showtime:</span>
            <div style="font-weight: 600;">${timeFormatted}</div>
          </div>
          <div>
            <span style="color: var(--text-dim);">Seats:</span>
            <div style="font-weight: 600; color: var(--accent-emerald);">${seatsText}</div>
          </div>
          <div>
            <span style="color: var(--text-dim);">Amount Paid:</span>
            <div style="font-weight: 700; color: var(--accent-gold);">₹${booking.totalPrice}</div>
          </div>
          <div>
            <span style="color: var(--text-dim);">Status:</span>
            <div style="font-weight: 700; color: var(--accent-emerald);">${booking.status}</div>
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 12px;">
        <button class="btn btn-secondary" style="flex: 1;" onclick="closeTicketModal(); showUserBookings();">
          View My Tickets
        </button>
        <button class="btn btn-primary" style="flex: 1;" onclick="closeTicketModal(); showView('home');">
          Back to Home
        </button>
      </div>
    </div>
  `;

  modal.classList.add('open');
}

function closeTicketModal() {
  const modal = document.getElementById('ticket-modal');
  if (modal) modal.classList.remove('open');
}

// ==========================================================================
// MY BOOKINGS (USER SPECIFIC AUTHENTIC TICKETS)
// ==========================================================================
async function showUserBookings() {
  if (!API.isAuthenticated()) {
    openAuthModal('login');
    return;
  }

  showView('my-bookings');
  const container = document.getElementById('user-bookings-list');
  if (!container) return;

  container.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 40px;">Fetching your bookings from database...</div>';

  try {
    const bookings = await API.bookings.getMyBookings();

    if (!bookings || bookings.length === 0) {
      container.innerHTML = `
        <div class="theater-card" style="text-align: center; padding: 60px 20px;">
          <div style="font-size: 3rem; margin-bottom: 12px;">🎟️</div>
          <h3>No bookings found in database</h3>
          <p style="color: var(--text-muted); margin-bottom: 18px;">You haven't reserved any cinema tickets yet.</p>
          <button class="btn btn-primary btn-sm" onclick="showView('home')">Browse Movies</button>
        </div>
      `;
      return;
    }

    container.innerHTML = bookings.map(b => {
      const seatsStr = (b.seats || []).map(s => s.seatNumber).join(', ');
      const isConfirmed = b.status === 'CONFIRMED';
      const statusBadge = `<span class="booking-status-badge ${b.status.toLowerCase()}">${b.status}</span>`;
      const dateStr = b.showStartTime ? new Date(b.showStartTime).toLocaleString() : '';

      return `
        <div class="theater-card booking-item-card" style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div>
              <div style="font-size: 1.2rem; font-weight: 700;">${b.movieTitle || 'Movie'}</div>
              <div style="color: var(--text-muted); font-size: 0.85rem; margin-top: 2px;">
                ${b.theatreName || b.theaterName || 'Cinema'} • ${b.screenName || 'Screen'}
              </div>
            </div>
            <div>
              ${statusBadge}
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; font-size: 0.85rem; background: var(--bg-surface-elevated); padding: 12px 16px; border-radius: var(--radius-sm); margin-bottom: 14px;">
            <div>
              <div style="color: var(--text-dim); font-size: 0.75rem;">SHOWTIME</div>
              <div style="font-weight: 600;">${dateStr}</div>
            </div>
            <div>
              <div style="color: var(--text-dim); font-size: 0.75rem;">SEATS</div>
              <div style="font-weight: 600; color: var(--accent-emerald);">${seatsStr || 'N/A'}</div>
            </div>
            <div>
              <div style="color: var(--text-dim); font-size: 0.75rem;">TOTAL AMOUNT</div>
              <div style="font-weight: 700; color: var(--accent-gold);">₹${b.totalPrice}</div>
            </div>
            <div>
              <div style="color: var(--text-dim); font-size: 0.75rem;">REFERENCE</div>
              <div>#${b.bookingId}</div>
            </div>
          </div>

          ${isConfirmed ? `
            <div style="display: flex; justify-content: flex-end;">
              <button class="btn btn-secondary btn-sm" style="color: #f87171; border-color: rgba(248, 113, 113, 0.3);" onclick="handleCancelBooking(${b.bookingId})">
                Cancel Ticket
              </button>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `
      <div style="color: #f87171; text-align: center; padding: 40px;">
        Failed to load bookings from database: ${err.message}
      </div>
    `;
  }
}

async function handleCancelBooking(bookingId) {
  if (!confirm(`Are you sure you want to cancel booking #${bookingId}?`)) return;

  try {
    await API.bookings.cancel(bookingId);
    showToast('Booking cancelled successfully', 'info');
    showUserBookings();
  } catch (err) {
    showToast(err.message || 'Failed to cancel booking', 'error');
  }
}

// ==========================================================================
// INITIAL SETUP ON DOM LOAD
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
  updateAuthUI();
  await checkBackendConnectivity();
  await loadCities();
  await loadMovies();

  // Search input handler
  const searchInput = document.getElementById('movie-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      handleSearch(e.target.value);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const firstItem = document.querySelector('.search-result-item');
        if (firstItem) {
          firstItem.click();
        } else {
          hideSearchDropdown();
          const grid = document.getElementById('movie-grid');
          if (grid) grid.scrollIntoView({ behavior: 'smooth' });
        }
      } else if (e.key === 'Escape') {
        hideSearchDropdown();
      }
    });

    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-bar-wrap')) {
        hideSearchDropdown();
      }
    });
  }

  // Periodic health check
  setInterval(checkBackendConnectivity, 15000);
});
