/**
 * CINEVERSE / BMS - ADMIN CONTROL CENTER JAVASCRIPT
 */

const adminState = {
  currentTab: 'overview',
  bookings: [],
  users: [],
  movies: [],
  theaters: [],
  screens: [],
  shows: [],
  cities: [],
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
// AUTHENTICATION & ACCESS GUARD
// ==========================================================================
function checkAdminAuth() {
  const user = API.getUser();
  const token = API.getToken();

  if (!token || !user || user.role !== 'ADMIN') {
    openModal('modal-auth-guard');
    return false;
  }

  // Populate admin user info in sidebar
  const nameEl = document.getElementById('admin-user-name');
  const roleEl = document.getElementById('admin-user-role');
  const avatarEl = document.getElementById('admin-user-avatar');

  if (nameEl) nameEl.textContent = user.name || user.email.split('@')[0];
  if (roleEl) roleEl.textContent = `${user.role} Control`;
  if (avatarEl) avatarEl.textContent = (user.name || user.email)[0].toUpperCase();

  closeModal('modal-auth-guard');
  return true;
}

async function handleAdminLogin(e) {
  e.preventDefault();
  const email = document.getElementById('adm-guard-email').value.trim();
  const password = document.getElementById('adm-guard-password').value;

  try {
    const res = await API.auth.login({ email, password });
    if (res.role !== 'ADMIN') {
      showToast('Signed in, but this account is not an ADMIN. Please use an Admin account.', 'error');
      return;
    }

    API.setSession(res.token, {
      userId: res.userId,
      email: res.email,
      name: res.name || res.email.split('@')[0],
      role: res.role,
    });

    showToast(`Authenticated as Administrator (${res.email})`, 'success');
    closeModal('modal-auth-guard');
    checkAdminAuth();
    refreshAllData();
  } catch (err) {
    showToast(err.message || 'Login failed. Please verify credentials.', 'error');
  }
}

function handleLogout() {
  API.clearSession();
  window.location.href = 'index.html';
}

// ==========================================================================
// NAVIGATION & TABS
// ==========================================================================
const tabMetadata = {
  overview: { title: 'System Overview & Analytics', subtitle: 'Real-time metrics, ticketing ledger, and catalog configuration' },
  bookings: { title: 'Master Bookings Ledger', subtitle: 'Audit, inspect, and cancel customer reservations across all theaters' },
  users: { title: 'Registered Users Directory', subtitle: 'System-wide user accounts, roles, and contact credentials' },
  movies: { title: 'Movie Catalog Management', subtitle: 'Add new titles, edit release metadata, or remove movies from circulation' },
  shows: { title: 'Showtime Schedules', subtitle: 'Manage showtimes across screens, dates, and ticket prices' },
  theaters: { title: 'Theaters & Screen Auditoriums', subtitle: 'Cinema locations, screen auditoriums, and seat capacity' },
  cities: { title: 'Cities & Regions', subtitle: 'Operational metropolitan zones and regions' },
};

function switchTab(tabId) {
  adminState.currentTab = tabId;

  // Update Sidebar Items
  document.querySelectorAll('.dash-nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tabId);
  });

  // Update View Tabs
  document.querySelectorAll('.dash-view-tab').forEach(el => {
    el.classList.toggle('active', el.id === `view-${tabId}`);
  });

  // Update Header Title
  const meta = tabMetadata[tabId] || { title: 'Dashboard', subtitle: '' };
  const titleEl = document.getElementById('tab-title');
  const subEl = document.getElementById('tab-subtitle');
  if (titleEl) titleEl.textContent = meta.title;
  if (subEl) subEl.textContent = meta.subtitle;

  // Trigger Tab Loader
  switch (tabId) {
    case 'overview': loadOverview(); break;
    case 'bookings': loadAllBookings(); break;
    case 'users': loadAllUsers(); break;
    case 'movies': loadMoviesCatalog(); break;
    case 'shows': loadAllShows(); break;
    case 'theaters': loadTheaters(); break;
    case 'cities': loadCities(); break;
  }

  // Close mobile sidebar if open
  const sidebar = document.getElementById('dash-sidebar');
  if (sidebar) sidebar.classList.remove('open');
}

function toggleSidebar() {
  const sidebar = document.getElementById('dash-sidebar');
  if (sidebar) sidebar.classList.toggle('open');
}

function refreshCurrentTab() {
  switchTab(adminState.currentTab);
}

// ==========================================================================
// MODAL CONTROLLERS
// ==========================================================================
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('open');
    // Pre-populate modal dropdowns if needed
    if (modalId === 'modal-add-theater') populateCityDropdown('th-city-id');
    if (modalId === 'modal-add-screen') populateTheaterDropdown('sc-theater-id');
    if (modalId === 'modal-add-show') {
      populateMovieDropdown('sh-movie-id');
      populateScreenDropdown('sh-screen-id');
      const dateInput = document.getElementById('sh-date');
      if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
      }
    }
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('open');
}

// ==========================================================================
// DATA FETCHERS & INITIALIZATION
// ==========================================================================
async function refreshAllData() {
  await Promise.allSettled([
    loadOverview(),
    loadCities(),
    loadTheaters(),
    loadMoviesCatalog(),
  ]);
}

// TAB 1: OVERVIEW
async function loadOverview() {
  try {
    const [bookingsRes, usersRes, moviesRes, theatersRes, screensRes, showsRes] = await Promise.allSettled([
      API.bookings.getAll(),
      API.auth.getAllUsers(),
      API.movies.getAll(),
      API.theaters.getAll(),
      API.screens.getAll(),
      API.shows.getAll(),
    ]);

    if (bookingsRes.status === 'fulfilled') adminState.bookings = bookingsRes.value || [];
    if (usersRes.status === 'fulfilled') adminState.users = usersRes.value || [];
    if (moviesRes.status === 'fulfilled') adminState.movies = moviesRes.value || [];
    if (theatersRes.status === 'fulfilled') adminState.theaters = theatersRes.value || [];
    if (screensRes.status === 'fulfilled') adminState.screens = screensRes.value || [];
    if (showsRes.status === 'fulfilled') adminState.shows = showsRes.value || [];

    // Compute Metrics
    const confirmedBookings = adminState.bookings.filter(b => b.status === 'CONFIRMED');
    const cancelledBookings = adminState.bookings.filter(b => b.status === 'CANCELLED');
    const totalRev = confirmedBookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);

    const revEl = document.getElementById('stat-revenue');
    if (revEl) revEl.textContent = `₹${totalRev.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    const bkEl = document.getElementById('stat-bookings');
    const bkSub = document.getElementById('stat-bookings-sub');
    if (bkEl) bkEl.textContent = adminState.bookings.length;
    if (bkSub) bkSub.textContent = `${confirmedBookings.length} Confirmed • ${cancelledBookings.length} Cancelled`;

    const usrEl = document.getElementById('stat-users');
    const usrSub = document.getElementById('stat-users-sub');
    if (usrEl) usrEl.textContent = adminState.users.length;
    if (usrSub) {
      const admins = adminState.users.filter(u => u.role === 'ADMIN').length;
      const managers = adminState.users.filter(u => u.role === 'MANAGER').length;
      const regular = adminState.users.filter(u => u.role === 'USER').length;
      usrSub.textContent = `${admins} Admins • ${managers} Managers • ${regular} Users`;
    }

    const mvEl = document.getElementById('stat-movies');
    if (mvEl) mvEl.textContent = adminState.movies.length;

    const thScEl = document.getElementById('stat-theaters-screens');
    if (thScEl) thScEl.textContent = `${adminState.theaters.length} / ${adminState.screens.length}`;

    const shEl = document.getElementById('stat-shows');
    if (shEl) shEl.textContent = adminState.shows.length;

    // Render Recent Bookings (top 6)
    renderOverviewRecentBookings();

  } catch (err) {
    console.error('Error loading overview:', err);
  }
}

function renderOverviewRecentBookings() {
  const tbody = document.getElementById('overview-recent-bookings-tbody');
  if (!tbody) return;

  const recent = [...adminState.bookings].slice(0, 6);
  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 24px;">No bookings found in system yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = recent.map(b => {
    const seatList = (b.seats || []).map(s => s.seatNumber).join(', ') || 'N/A';
    return `
      <tr>
        <td><strong>#${b.bookingId}</strong></td>
        <td>
          <div style="font-weight: 600;">${b.userName || 'Customer'}</div>
          <div style="font-size: 0.75rem; color: var(--text-dim);">User ID #${b.userId || '—'}</div>
        </td>
        <td><strong>${b.movieTitle || 'Movie'}</strong></td>
        <td>${b.theatreName || 'Cinema'} <span style="color: var(--text-dim);">(${b.screenName || 'Screen'})</span></td>
        <td><span style="color: var(--accent-gold); font-weight: 600;">${seatList}</span></td>
        <td><strong style="color: var(--accent-emerald);">₹${b.totalPrice}</strong></td>
        <td><span class="status-pill ${b.status}">${b.status}</span></td>
        <td>
          ${b.status === 'CONFIRMED' ? `
            <button class="btn btn-secondary btn-sm" style="color: #f87171; border-color: rgba(239, 68, 68, 0.4); padding: 4px 8px; font-size: 0.75rem;" 
                    onclick="handleCancelBooking(${b.bookingId})">Cancel</button>
          ` : '<span style="color: var(--text-dim); font-size: 0.75rem;">—</span>'}
        </td>
      </tr>
    `;
  }).join('');
}

// TAB 2: ALL BOOKINGS
async function loadAllBookings() {
  const tbody = document.getElementById('all-bookings-tbody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 40px;">Fetching all system bookings...</td></tr>`;

  try {
    const list = await API.bookings.getAll();
    adminState.bookings = list || [];
    filterBookings();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #f87171; padding: 24px;">Failed to load bookings: ${err.message}</td></tr>`;
  }
}

function filterBookings() {
  const tbody = document.getElementById('all-bookings-tbody');
  if (!tbody) return;

  const query = (document.getElementById('bookings-search-input')?.value || '').toLowerCase().trim();
  const statusFilter = document.getElementById('bookings-status-filter')?.value || 'ALL';

  const filtered = adminState.bookings.filter(b => {
    const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const matchQuery = !query ||
      String(b.bookingId).includes(query) ||
      (b.userName && b.userName.toLowerCase().includes(query)) ||
      (b.movieTitle && b.movieTitle.toLowerCase().includes(query)) ||
      (b.theatreName && b.theatreName.toLowerCase().includes(query));
    return matchStatus && matchQuery;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 32px;">No bookings match the filter criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(b => {
    const seatList = (b.seats || []).map(s => s.seatNumber).join(', ') || 'N/A';
    const bookedDate = b.bookedAt ? new Date(b.bookedAt).toLocaleString('en-IN') : '—';

    return `
      <tr>
        <td><strong>#${b.bookingId}</strong></td>
        <td>
          <div style="font-weight: 600;">${b.userName || 'Customer'}</div>
          <div style="font-size: 0.75rem; color: var(--text-dim);">User ID #${b.userId || '—'}</div>
        </td>
        <td><strong>${b.movieTitle || 'Movie'}</strong></td>
        <td>${b.theatreName || 'Cinema'} <div style="font-size: 0.75rem; color: var(--text-dim);">${b.screenName || 'Screen'}</div></td>
        <td><div style="font-size: 0.8rem; color: var(--text-muted);">${b.showStartTime ? new Date(b.showStartTime).toLocaleString('en-IN') : '—'}</div></td>
        <td><span style="color: var(--accent-gold); font-weight: 600;">${seatList}</span></td>
        <td><strong style="color: var(--accent-emerald);">₹${b.totalPrice}</strong></td>
        <td><span class="status-pill ${b.status}">${b.status}</span></td>
        <td>
          ${b.status === 'CONFIRMED' ? `
            <button class="btn btn-secondary btn-sm" style="color: #f87171; border-color: rgba(239, 68, 68, 0.4); padding: 5px 10px; font-size: 0.75rem;" 
                    onclick="handleCancelBooking(${b.bookingId})">Cancel Ticket</button>
          ` : '<span style="color: var(--text-dim); font-size: 0.75rem;">Cancelled</span>'}
        </td>
      </tr>
    `;
  }).join('');
}

async function handleCancelBooking(bookingId) {
  if (!confirm(`Are you sure you want to cancel Booking #${bookingId}? This will release the seats immediately.`)) return;

  try {
    await API.bookings.cancel(bookingId);
    showToast(`Booking #${bookingId} has been cancelled`, 'info');
    loadOverview();
    if (adminState.currentTab === 'bookings') loadAllBookings();
  } catch (err) {
    showToast(`Failed to cancel booking: ${err.message}`, 'error');
  }
}

// TAB 3: USER DIRECTORY
async function loadAllUsers() {
  const tbody = document.getElementById('all-users-tbody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 40px;">Loading registered users...</td></tr>`;

  try {
    const list = await API.auth.getAllUsers();
    adminState.users = list || [];
    filterUsers();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #f87171; padding: 24px;">Failed to load users: ${err.message}</td></tr>`;
  }
}

function filterUsers() {
  const tbody = document.getElementById('all-users-tbody');
  if (!tbody) return;

  const query = (document.getElementById('users-search-input')?.value || '').toLowerCase().trim();
  const roleFilter = document.getElementById('users-role-filter')?.value || 'ALL';

  const filtered = adminState.users.filter(u => {
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchQuery = !query ||
      String(u.id).includes(query) ||
      (u.name && u.name.toLowerCase().includes(query)) ||
      (u.email && u.email.toLowerCase().includes(query)) ||
      (u.phone && u.phone.includes(query));
    return matchRole && matchQuery;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px;">No users match the search criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(u => `
    <tr>
      <td><strong>#${u.id}</strong></td>
      <td>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div class="dash-user-avatar" style="width: 28px; height: 28px; font-size: 0.75rem;">${(u.name || u.email)[0].toUpperCase()}</div>
          <strong>${u.name || 'User'}</strong>
        </div>
      </td>
      <td><code>${u.email}</code></td>
      <td>${u.phone || '<span style="color: var(--text-dim);">None</span>'}</td>
      <td><span class="role-pill ${u.role}">${u.role}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" style="padding: 4px 8px; font-size: 0.75rem;" onclick="viewUserDetails(${u.id})">Details</button>
      </td>
    </tr>
  `).join('');
}

async function viewUserDetails(id) {
  try {
    const user = await API.auth.getUserById(id);
    alert(`User Profile #${user.id}\nName: ${user.name}\nEmail: ${user.email}\nPhone: ${user.phone || 'N/A'}\nRole: ${user.role}`);
  } catch (err) {
    showToast('Failed to fetch user details: ' + err.message, 'error');
  }
}

// TAB 4: MOVIE CATALOG
async function loadMoviesCatalog() {
  const container = document.getElementById('movies-manage-container');
  if (!container) return;
  container.innerHTML = '<div style="color: var(--text-muted); padding: 30px;">Loading movie titles...</div>';

  try {
    const list = await API.movies.getAll();
    adminState.movies = list || [];
    filterMovies();
  } catch (err) {
    container.innerHTML = `<div style="color: #f87171; padding: 20px;">Failed to load movies: ${err.message}</div>`;
  }
}

function filterMovies() {
  const container = document.getElementById('movies-manage-container');
  if (!container) return;

  const query = (document.getElementById('movies-search-input')?.value || '').toLowerCase().trim();
  const filtered = adminState.movies.filter(m => {
    return !query ||
      (m.title && m.title.toLowerCase().includes(query)) ||
      (m.genre && m.genre.toLowerCase().includes(query)) ||
      (m.language && m.language.toLowerCase().includes(query));
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="color: var(--text-muted); padding: 30px;">No movies found matching criteria.</div>`;
    return;
  }

  container.innerHTML = filtered.map(m => `
    <div class="movie-manage-card">
      <img src="${m.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600'}" alt="${m.title}" class="movie-manage-thumb" onerror="this.src='https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600'">
      <div class="movie-manage-body">
        <div class="movie-manage-title">${m.title}</div>
        <div class="movie-manage-meta">
          <span style="color: var(--accent-gold);">⭐ ${m.rating || 0}/10</span>
          <span>•</span>
          <span>${m.durationMinutes || 120} min</span>
          <span>•</span>
          <span>${m.genre || 'Action'}</span>
          <span>•</span>
          <span>${m.language || 'English'}</span>
        </div>
        <p style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
          ${m.description || 'No description provided.'}
        </p>
        <div class="movie-manage-actions">
          <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="openEditMovieModal(${m.id})">Edit</button>
          <button class="btn btn-secondary btn-sm" style="color: #f87171; border-color: rgba(239, 68, 68, 0.4);" onclick="handleDeleteMovie(${m.id}, '${m.title}')">Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

function openEditMovieModal(movieId) {
  const movie = adminState.movies.find(m => m.id === movieId);
  if (!movie) return;

  document.getElementById('movie-modal-title').textContent = `Edit Movie: ${movie.title}`;
  document.getElementById('movie-edit-id').value = movie.id;
  document.getElementById('movie-title').value = movie.title || '';
  document.getElementById('movie-genre').value = movie.genre || '';
  document.getElementById('movie-lang').value = movie.language || '';
  document.getElementById('movie-duration').value = movie.durationMinutes || 120;
  document.getElementById('movie-rating').value = movie.rating || 8.0;
  document.getElementById('movie-release-date').value = movie.releaseDate || new Date().toISOString().split('T')[0];
  document.getElementById('movie-poster').value = movie.posterUrl || '';
  document.getElementById('movie-desc').value = movie.description || '';
  document.getElementById('movie-submit-btn').textContent = 'Update Movie';

  openModal('modal-add-movie');
}

async function handleSaveMovie(e) {
  e.preventDefault();
  const editId = document.getElementById('movie-edit-id').value;

  const movieData = {
    title: document.getElementById('movie-title').value.trim(),
    genre: document.getElementById('movie-genre').value.trim(),
    language: document.getElementById('movie-lang').value.trim(),
    durationMinutes: Number(document.getElementById('movie-duration').value),
    rating: Number(document.getElementById('movie-rating').value),
    releaseDate: document.getElementById('movie-release-date').value,
    posterUrl: document.getElementById('movie-poster').value.trim(),
    description: document.getElementById('movie-desc').value.trim(),
  };

  try {
    if (editId) {
      await API.movies.update(editId, movieData);
      showToast(`Updated "${movieData.title}" successfully!`, 'success');
    } else {
      await API.movies.add(movieData);
      showToast(`Added "${movieData.title}" to catalog!`, 'success');
    }

    closeModal('modal-add-movie');
    e.target.reset();
    document.getElementById('movie-edit-id').value = '';
    document.getElementById('movie-modal-title').textContent = 'Add Movie to Catalog';
    document.getElementById('movie-submit-btn').textContent = 'Save Movie';
    loadMoviesCatalog();
    loadOverview();
  } catch (err) {
    showToast(err.message || 'Operation failed', 'error');
  }
}

async function handleDeleteMovie(movieId, title) {
  if (!confirm(`Are you sure you want to permanently delete "${title}"? This cannot be undone.`)) return;

  try {
    await API.movies.delete(movieId);
    showToast(`Deleted "${title}" from catalog`, 'info');
    loadMoviesCatalog();
    loadOverview();
  } catch (err) {
    showToast(`Failed to delete movie: ${err.message}`, 'error');
  }
}

// TAB 5: SHOWS
async function loadAllShows() {
  const tbody = document.getElementById('all-shows-tbody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 40px;">Loading scheduled showtimes...</td></tr>`;

  try {
    const list = await API.shows.getAll();
    adminState.shows = list || [];

    if (adminState.shows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">No showtimes scheduled. Click "+ Schedule New Show" to add one.</td></tr>`;
      return;
    }

    tbody.innerHTML = adminState.shows.map(s => {
      const showDate = s.showDate || '—';
      const startTime = s.startTime ? s.startTime.substring(0, 5) : '—';
      const endTime = s.endTime ? s.endTime.substring(0, 5) : '—';

      return `
        <tr>
          <td><strong>#${s.id}</strong></td>
          <td><strong>${s.movieTitle || 'Movie'}</strong></td>
          <td>${s.theatreName || 'Cinema'} <div style="font-size: 0.75rem; color: var(--text-dim);">${s.screenName || 'Screen'}</div></td>
          <td>${showDate}</td>
          <td><strong>${startTime}</strong> <span style="color: var(--text-dim); font-size: 0.8rem;">to ${endTime}</span></td>
          <td><strong style="color: var(--accent-emerald);">₹${s.ticketPrice}</strong></td>
          <td><span class="status-pill ${s.status || 'ACTIVE'}">${s.status || 'ACTIVE'}</span></td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #f87171; padding: 24px;">Failed to load shows: ${err.message}</td></tr>`;
  }
}

function calculateShowEndTime() {
  const movieSelect = document.getElementById('sh-movie-id');
  const startTimeInput = document.getElementById('sh-start-time');
  const endTimeInput = document.getElementById('sh-end-time');

  if (!movieSelect || !startTimeInput || !endTimeInput) return;

  const movieId = Number(movieSelect.value);
  const startTime = startTimeInput.value;
  if (!movieId || !startTime) return;

  const movie = adminState.movies.find(m => m.id === movieId);
  const duration = (movie && movie.durationMinutes) ? movie.durationMinutes : 120;

  const [hours, minutes] = startTime.split(':').map(Number);
  const totalStartMinutes = (hours * 60) + minutes;
  const totalEndMinutes = totalStartMinutes + duration + 15; // 15 min buffer

  const endH = Math.floor((totalEndMinutes / 60) % 24);
  const endM = Math.floor(totalEndMinutes % 60);

  endTimeInput.value = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

async function handleScheduleShow(e) {
  e.preventDefault();
  const movieId = Number(document.getElementById('sh-movie-id').value);
  const screenId = Number(document.getElementById('sh-screen-id').value);
  const showDate = document.getElementById('sh-date').value;
  let startTime = document.getElementById('sh-start-time').value;
  let endTime = document.getElementById('sh-end-time').value;
  const ticketPrice = Number(document.getElementById('sh-price').value);

  if (startTime.length === 5) startTime += ':00';
  if (endTime.length === 5) endTime += ':00';

  try {
    await API.shows.add({
      movieId,
      screenId,
      showDate,
      startTime,
      endTime,
      ticketPrice,
    });

    showToast('Showtime scheduled successfully!', 'success');
    closeModal('modal-add-show');
    e.target.reset();
    loadAllShows();
    loadOverview();
  } catch (err) {
    showToast(err.message || 'Failed to schedule show', 'error');
  }
}

// TAB 6: THEATERS & SCREENS
async function loadTheaters() {
  const container = document.getElementById('theaters-list-container');
  if (!container) return;
  container.innerHTML = '<div style="color: var(--text-muted); padding: 30px;">Loading theaters...</div>';

  try {
    const [theaters, screens, cities] = await Promise.all([
      API.theaters.getAll(),
      API.screens.getAll(),
      API.cities.getAll(),
    ]);

    adminState.theaters = theaters || [];
    adminState.screens = screens || [];
    adminState.cities = cities || [];

    // Populate City Filter
    populateCityDropdown('theaters-city-filter', true);

    const cityFilter = document.getElementById('theaters-city-filter')?.value;
    const filteredTheaters = cityFilter
      ? adminState.theaters.filter(t => String(t.cityId) === String(cityFilter))
      : adminState.theaters;

    if (filteredTheaters.length === 0) {
      container.innerHTML = '<div style="color: var(--text-muted); padding: 30px;">No theaters found for this selection.</div>';
      return;
    }

    container.innerHTML = filteredTheaters.map(t => {
      const theaterScreens = adminState.screens.filter(s => String(s.theaterId) === String(t.id));
      const cityName = (adminState.cities.find(c => c.id === t.cityId) || {}).name || 'City';

      return `
        <div class="dash-panel" style="padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div>
              <h3 style="font-size: 1.1rem; margin-bottom: 4px;">${t.name}</h3>
              <div style="font-size: 0.8rem; color: var(--text-muted);">${t.address || ''}, ${cityName}</div>
            </div>
            <span class="dash-badge manager" style="font-size: 0.7rem;">${theaterScreens.length} Screens</span>
          </div>

          <div style="margin-top: 14px; border-top: 1px solid var(--border-subtle); padding-top: 12px;">
            <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-dim); margin-bottom: 8px; font-weight: 700;">Auditoriums / Screens:</div>
            ${theaterScreens.length > 0 ? `
              <div style="display: flex; flex-direction: column; gap: 6px;">
                ${theaterScreens.map(s => `
                  <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255, 255, 255, 0.03); padding: 6px 10px; border-radius: var(--radius-sm); font-size: 0.8rem;">
                    <span>${s.name}</span>
                    <span style="color: var(--accent-cyan); font-weight: 600;">${s.totalSeats || 0} seats</span>
                  </div>
                `).join('')}
              </div>
            ` : '<div style="font-size: 0.8rem; color: var(--text-dim);">No screens configured yet.</div>'}
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    container.innerHTML = `<div style="color: #f87171; padding: 20px;">Failed to load theaters: ${err.message}</div>`;
  }
}

async function handleCreateTheater(e) {
  e.preventDefault();
  const name = document.getElementById('th-name').value.trim();
  const address = document.getElementById('th-address').value.trim();
  const cityId = Number(document.getElementById('th-city-id').value);

  try {
    await API.theaters.add({ name, address, cityId });
    showToast(`Theater "${name}" registered successfully!`, 'success');
    closeModal('modal-add-theater');
    e.target.reset();
    loadTheaters();
    loadOverview();
  } catch (err) {
    showToast(err.message || 'Failed to create theater', 'error');
  }
}

async function handleCreateScreen(e) {
  e.preventDefault();
  const name = document.getElementById('sc-name').value.trim();
  const theaterId = Number(document.getElementById('sc-theater-id').value);
  const totalSeats = Number(document.getElementById('sc-total-seats').value);

  try {
    await API.screens.add({ name, theaterId, totalSeats });
    showToast(`Screen "${name}" created!`, 'success');
    closeModal('modal-add-screen');
    e.target.reset();
    loadTheaters();
    loadOverview();
  } catch (err) {
    showToast(err.message || 'Failed to create screen', 'error');
  }
}

// TAB 7: CITIES
async function loadCities() {
  try {
    const list = await API.cities.getAll();
    adminState.cities = list || [];
    populateCityDropdown('theaters-city-filter', true);
    populateCityDropdown('th-city-id');

    const tbody = document.getElementById('cities-tbody');
    if (!tbody) return;

    if (adminState.cities.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 24px;">No cities registered yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = adminState.cities.map(c => `
      <tr>
        <td><strong>#${c.id}</strong></td>
        <td><strong>${c.name}</strong></td>
        <td>${c.state}</td>
      </tr>
    `).join('');
  } catch (err) {
    const tbody = document.getElementById('cities-tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #f87171; padding: 20px;">Failed to load cities: ${err.message}</td></tr>`;
  }
}

async function handleCreateCity(e) {
  e.preventDefault();
  const name = document.getElementById('city-name-input').value.trim();
  const state = document.getElementById('city-state-input').value.trim();

  try {
    await API.cities.add({ name, state });
    showToast(`City "${name}" created successfully!`, 'success');
    e.target.reset();
    loadCities();
    loadOverview();
  } catch (err) {
    showToast(err.message || 'Failed to create city', 'error');
  }
}

// ==========================================================================
// DROPDOWN POPULATORS
// ==========================================================================
function populateCityDropdown(selectId, allowAll = false) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const currentVal = select.value;
  let html = allowAll ? '<option value="">All Cities</option>' : '<option value="">Select City</option>';
  html += adminState.cities.map(c => `<option value="${c.id}">${c.name}, ${c.state}</option>`).join('');
  select.innerHTML = html;
  if (currentVal) select.value = currentVal;
}

function populateTheaterDropdown(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  let html = '<option value="">Select Theater</option>';
  html += adminState.theaters.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  select.innerHTML = html;
}

function populateScreenDropdown(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  let html = '<option value="">Select Screen Auditorium</option>';
  html += adminState.screens.map(s => {
    const theater = adminState.theaters.find(t => t.id === s.theaterId);
    return `<option value="${s.id}">${theater ? theater.name + ' — ' : ''}${s.name}</option>`;
  }).join('');
  select.innerHTML = html;
}

function populateMovieDropdown(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  let html = '<option value="">Select Movie</option>';
  html += adminState.movies.map(m => `<option value="${m.id}">${m.title} (${m.durationMinutes || 120} min)</option>`).join('');
  select.innerHTML = html;
}

function handleAdminSearch(query) {
  const q = (query || '').toLowerCase().trim();
  const currentTab = adminState.currentTab;

  switch (currentTab) {
    case 'overview': {
      const tbody = document.getElementById('overview-recent-bookings-tbody');
      if (!tbody) break;
      const recent = (adminState.bookings || []).filter(b => 
        !q || String(b.bookingId).includes(q) ||
        (b.userName && b.userName.toLowerCase().includes(q)) ||
        (b.movieTitle && b.movieTitle.toLowerCase().includes(q)) ||
        (b.theatreName && b.theatreName.toLowerCase().includes(q))
      ).slice(0, 6);
      if (recent.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 24px;">No matching recent bookings found.</td></tr>`;
        break;
      }
      tbody.innerHTML = recent.map(b => {
        const seatList = (b.seats || []).map(s => s.seatNumber).join(', ') || 'N/A';
        return `
          <tr>
            <td><strong>#${b.bookingId}</strong></td>
            <td>
              <div style="font-weight: 600;">${b.userName || 'Customer'}</div>
              <div style="font-size: 0.75rem; color: var(--text-dim);">User ID #${b.userId || '—'}</div>
            </td>
            <td><strong>${b.movieTitle || 'Movie'}</strong></td>
            <td>${b.theatreName || 'Cinema'} <span style="color: var(--text-dim);">(${b.screenName || 'Screen'})</span></td>
            <td><span style="color: var(--accent-gold); font-weight: 600;">${seatList}</span></td>
            <td><strong style="color: var(--accent-emerald);">₹${b.totalPrice}</strong></td>
            <td><span class="status-pill ${b.status}">${b.status}</span></td>
            <td>
              ${b.status === 'CONFIRMED' ? `
                <button class="btn btn-secondary btn-sm" style="color: #f87171; border-color: rgba(239, 68, 68, 0.4); padding: 4px 8px; font-size: 0.75rem;" 
                        onclick="handleCancelBooking(${b.bookingId})">Cancel</button>
              ` : '<span style="color: var(--text-dim); font-size: 0.75rem;">—</span>'}
            </td>
          </tr>
        `;
      }).join('');
      break;
    }
    case 'bookings': {
      const input = document.getElementById('bookings-search-input');
      if (input) input.value = q;
      filterBookings();
      break;
    }
    case 'users': {
      const input = document.getElementById('users-search-input');
      if (input) input.value = q;
      filterUsers();
      break;
    }
    case 'movies': {
      const input = document.getElementById('movies-search-input');
      if (input) input.value = q;
      filterMovies();
      break;
    }
    case 'shows': {
      const tbody = document.getElementById('all-shows-tbody');
      if (!tbody) break;
      const filtered = (adminState.shows || []).filter(s =>
        !q ||
        String(s.id).includes(q) ||
        (s.movieTitle && s.movieTitle.toLowerCase().includes(q)) ||
        (s.theatreName && s.theatreName.toLowerCase().includes(q)) ||
        (s.screenName && s.screenName.toLowerCase().includes(q))
      );
      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">No showtimes matching "${query}".</td></tr>`;
        break;
      }
      tbody.innerHTML = filtered.map(s => {
        const showDate = s.showDate || '—';
        const startTime = s.startTime ? s.startTime.substring(0, 5) : '—';
        const endTime = s.endTime ? s.endTime.substring(0, 5) : '—';
        return `
          <tr>
            <td><strong>#${s.id}</strong></td>
            <td><strong>${s.movieTitle || 'Movie'}</strong></td>
            <td>${s.theatreName || 'Cinema'} <div style="font-size: 0.75rem; color: var(--text-dim);">${s.screenName || 'Screen'}</div></td>
            <td>${showDate}</td>
            <td><strong>${startTime}</strong> <span style="color: var(--text-dim); font-size: 0.8rem;">to ${endTime}</span></td>
            <td><strong style="color: var(--accent-emerald);">₹${s.ticketPrice}</strong></td>
            <td><span class="status-pill ${s.status || 'ACTIVE'}">${s.status || 'ACTIVE'}</span></td>
          </tr>
        `;
      }).join('');
      break;
    }
    case 'theaters': {
      const container = document.getElementById('theaters-container');
      if (!container) break;
      const filtered = (adminState.theaters || []).filter(t =>
        !q ||
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.address && t.address.toLowerCase().includes(q))
      );
      if (filtered.length === 0) {
        container.innerHTML = `<div style="color: var(--text-muted); padding: 20px;">No theaters matching "${query}".</div>`;
        break;
      }
      container.innerHTML = filtered.map(t => {
        const theaterScreens = adminState.screens.filter(s => String(s.theaterId) === String(t.id));
        const cityName = (adminState.cities.find(c => c.id === t.cityId) || {}).name || 'City';
        return `
          <div class="dash-panel" style="padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
              <div>
                <h3 style="font-size: 1.1rem; margin-bottom: 4px;">${t.name}</h3>
                <div style="font-size: 0.8rem; color: var(--text-muted);">${t.address || ''}, ${cityName}</div>
              </div>
              <span class="dash-badge manager" style="font-size: 0.7rem;">${theaterScreens.length} Screens</span>
            </div>
            <div style="margin-top: 14px; border-top: 1px solid var(--border-subtle); padding-top: 12px;">
              <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-dim); margin-bottom: 8px; font-weight: 700;">Auditoriums / Screens:</div>
              ${theaterScreens.length > 0 ? `
                <div style="display: flex; flex-direction: column; gap: 6px;">
                  ${theaterScreens.map(s => `
                    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255, 255, 255, 0.03); padding: 6px 10px; border-radius: var(--radius-sm); font-size: 0.8rem;">
                      <span>${s.name}</span>
                      <span style="color: var(--accent-cyan); font-weight: 600;">${s.totalSeats || 0} seats</span>
                    </div>
                  `).join('')}
                </div>
              ` : '<div style="font-size: 0.8rem; color: var(--text-dim);">No screens configured yet.</div>'}
            </div>
          </div>
        `;
      }).join('');
      break;
    }
    case 'cities': {
      const tbody = document.getElementById('cities-tbody');
      if (!tbody) break;
      const filtered = (adminState.cities || []).filter(c =>
        !q ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.state && c.state.toLowerCase().includes(q))
      );
      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 32px;">No cities matching "${query}".</td></tr>`;
        break;
      }
      tbody.innerHTML = filtered.map(c => {
        const theaterCount = adminState.theaters.filter(t => t.cityId === c.id).length;
        return `
          <tr>
            <td><strong>#${c.id}</strong></td>
            <td><strong>${c.name}</strong></td>
            <td>${c.state}</td>
            <td><span class="dash-badge manager" style="font-size: 0.75rem;">${theaterCount} Theaters</span></td>
          </tr>
        `;
      }).join('');
      break;
    }
  }
}

// ==========================================================================
// DOM INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  const authed = checkAdminAuth();
  if (authed) {
    refreshAllData();
  }
});
