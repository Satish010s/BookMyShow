/**
 * CINEVERSE / BMS - THEATER MANAGER OPERATIONS JAVASCRIPT
 */

const managerState = {
  currentTab: 'overview',
  shows: [],
  theaters: [],
  screens: [],
  movies: [],
  cities: [],
  selectedShowId: null,
  currentScreenSeats: [],
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
function checkManagerAuth() {
  const user = API.getUser();
  const token = API.getToken();

  if (!token || !user || (user.role !== 'MANAGER' && user.role !== 'ADMIN')) {
    openManagerModal('modal-mgr-auth-guard');
    return false;
  }

  // Populate manager user info in sidebar
  const nameEl = document.getElementById('manager-user-name');
  const roleEl = document.getElementById('manager-user-role');
  const avatarEl = document.getElementById('manager-user-avatar');
  const adminLink = document.getElementById('link-to-admin');

  if (nameEl) nameEl.textContent = user.name || user.email.split('@')[0];
  if (roleEl) roleEl.textContent = `${user.role} Operations`;
  if (avatarEl) avatarEl.textContent = (user.name || user.email)[0].toUpperCase();

  // Show Admin Center link if user is ADMIN
  if (adminLink) {
    adminLink.style.display = user.role === 'ADMIN' ? 'flex' : 'none';
  }

  closeManagerModal('modal-mgr-auth-guard');
  return true;
}

async function handleManagerLogin(e) {
  e.preventDefault();
  const email = document.getElementById('mgr-guard-email').value.trim();
  const password = document.getElementById('mgr-guard-password').value;

  try {
    const res = await API.auth.login({ email, password });
    if (res.role !== 'MANAGER' && res.role !== 'ADMIN') {
      showToast('Signed in, but this account is not a MANAGER or ADMIN.', 'error');
      return;
    }

    API.setSession(res.token, {
      userId: res.userId,
      email: res.email,
      name: res.name || res.email.split('@')[0],
      role: res.role,
    });

    showToast(`Welcome to Operations Hub, ${res.email}!`, 'success');
    closeManagerModal('modal-mgr-auth-guard');
    checkManagerAuth();
    refreshAllManagerData();
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
const managerTabMetadata = {
  overview: { title: 'Operations Overview', subtitle: 'Real-time theater status, today\'s show schedule, and key metrics' },
  scheduler: { title: 'Showtime Scheduler', subtitle: 'Program movie screenings, time slots, and pricing across auditoriums' },
  occupancy: { title: 'Show Bookings & Occupancy Inspector', subtitle: 'Audit visual seat layout, attendance rate, and customer reservations' },
  'seat-builder': { title: 'Seat Layout Builder', subtitle: 'Configure physical seats and generate VIP / Premium / Regular tiers' },
  theaters: { title: 'Cinema Theaters & Auditoriums', subtitle: 'Register multiplexes, locations, and screen capacity' },
  movies: { title: 'Movie Catalog Management', subtitle: 'Manage active titles and screening runtimes' },
  'counter-lookup': { title: 'Customer & Ticket Lookup', subtitle: 'Box-office verification of customer accounts and booking tickets' },
};

function switchManagerTab(tabId) {
  managerState.currentTab = tabId;

  // Update Sidebar Items
  document.querySelectorAll('.dash-nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tabId);
  });

  // Update View Tabs
  document.querySelectorAll('.dash-view-tab').forEach(el => {
    el.classList.toggle('active', el.id === `view-${tabId}`);
  });

  // Update Header Title
  const meta = managerTabMetadata[tabId] || { title: 'Manager Operations', subtitle: '' };
  const titleEl = document.getElementById('tab-title');
  const subEl = document.getElementById('tab-subtitle');
  if (titleEl) titleEl.textContent = meta.title;
  if (subEl) subEl.textContent = meta.subtitle;

  // Trigger Tab Loader
  switch (tabId) {
    case 'overview': loadManagerOverview(); break;
    case 'scheduler': loadSchedulerTab(); break;
    case 'occupancy': loadOccupancyTab(); break;
    case 'seat-builder': loadSeatBuilderTab(); break;
    case 'theaters': loadManagerTheaters(); break;
    case 'movies': loadManagerMovies(); break;
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
  switchManagerTab(managerState.currentTab);
}

// ==========================================================================
// MODAL CONTROLLERS
// ==========================================================================
function openManagerModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('open');
    if (modalId === 'modal-mgr-theater') populateMgrCityDropdown('mgr-th-city-id');
    if (modalId === 'modal-mgr-screen') populateMgrTheaterDropdown('mgr-sc-theater-id');
  }
}

function closeManagerModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('open');
}

async function loadManagerCities() {
  try {
    const list = await API.cities.getAll();
    managerState.cities = list || [];
    populateMgrCityDropdown('mgr-th-city-id');
  } catch (err) {
    console.error('Failed to load manager cities:', err);
  }
}

// ==========================================================================
// DATA FETCHERS & INITIALIZATION
// ==========================================================================
async function refreshAllManagerData() {
  await Promise.allSettled([
    loadManagerOverview(),
    loadManagerCities(),
    loadManagerTheaters(),
    loadManagerMovies(),
  ]);

  populateMgrCityDropdown('mgr-th-city-id');
  populateMgrTheaterDropdown('mgr-sc-theater-id');
  populateMgrMovieDropdown('sch-movie-id');
  populateMgrScreenDropdown('sch-screen-id');
}

// TAB 1: OPERATIONS OVERVIEW
async function loadManagerOverview() {
  try {
    const [showsRes, theatersRes, screensRes, moviesRes] = await Promise.allSettled([
      API.shows.getAll(),
      API.theaters.getAll(),
      API.screens.getAll(),
      API.movies.getAll(),
    ]);

    if (showsRes.status === 'fulfilled') managerState.shows = showsRes.value || [];
    if (theatersRes.status === 'fulfilled') managerState.theaters = theatersRes.value || [];
    if (screensRes.status === 'fulfilled') managerState.screens = screensRes.value || [];
    if (moviesRes.status === 'fulfilled') managerState.movies = moviesRes.value || [];

    const todayStr = new Date().toISOString().split('T')[0];
    const todayShows = managerState.shows.filter(s => s.showDate === todayStr);

    const todayEl = document.getElementById('stat-m-today-shows');
    if (todayEl) todayEl.textContent = todayShows.length;

    const screensEl = document.getElementById('stat-m-screens');
    const screensSub = document.getElementById('stat-m-screens-sub');
    if (screensEl) screensEl.textContent = managerState.screens.length;
    if (screensSub) screensSub.textContent = `Across ${managerState.theaters.length} theaters`;

    const moviesEl = document.getElementById('stat-m-movies');
    if (moviesEl) moviesEl.textContent = managerState.movies.length;

    const totalShowsEl = document.getElementById('stat-m-total-shows');
    if (totalShowsEl) totalShowsEl.textContent = managerState.shows.length;

    renderTodayShows(todayShows.length > 0 ? todayShows : managerState.shows.slice(0, 6));

  } catch (err) {
    console.error('Error loading manager overview:', err);
  }
}

function renderTodayShows(showsList) {
  const tbody = document.getElementById('mgr-today-shows-tbody');
  if (!tbody) return;

  if (!showsList || showsList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">No shows scheduled for today. Use the Scheduler to program one.</td></tr>`;
    return;
  }

  tbody.innerHTML = showsList.map(s => {
    const startTime = s.startTime ? s.startTime.substring(0, 5) : '—';
    const endTime = s.endTime ? s.endTime.substring(0, 5) : '—';

    return `
      <tr>
        <td><strong>#${s.id}</strong></td>
        <td><strong>${s.movieTitle || 'Movie'}</strong></td>
        <td>${s.theatreName || 'Cinema'} <span style="color: var(--text-dim); font-size: 0.8rem;">(${s.screenName || 'Screen'})</span></td>
        <td><strong>${startTime}</strong> <span style="color: var(--text-dim);">to ${endTime}</span></td>
        <td><strong style="color: var(--accent-emerald);">₹${s.ticketPrice}</strong></td>
        <td>
          <button class="btn btn-secondary btn-sm" style="padding: 4px 10px; font-size: 0.75rem;" onclick="inspectSpecificShow(${s.id})">
            Audit Occupancy →
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function inspectSpecificShow(showId) {
  managerState.selectedShowId = showId;
  switchManagerTab('occupancy');
  const select = document.getElementById('occupancy-show-select');
  if (select) {
    select.value = showId;
    loadShowOccupancyDetails();
  }
}

// TAB 2: SHOWTIME SCHEDULER
async function loadSchedulerTab() {
  populateMgrMovieDropdown('sch-movie-id');
  populateMgrScreenDropdown('sch-screen-id');

  const dateInput = document.getElementById('sch-date');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  const tbody = document.getElementById('sch-all-shows-tbody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">Loading show schedules...</td></tr>`;

  try {
    const list = await API.shows.getAll();
    managerState.shows = list || [];
    filterSchedulerShows();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #f87171; padding: 20px;">Failed to load shows: ${err.message}</td></tr>`;
  }
}

function filterSchedulerShows() {
  const tbody = document.getElementById('sch-all-shows-tbody');
  if (!tbody) return;

  const dateFilter = document.getElementById('sch-filter-date')?.value;
  const filtered = dateFilter
    ? managerState.shows.filter(s => s.showDate === dateFilter)
    : managerState.shows;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">No showtimes found for the selected date.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(s => {
    const startTime = s.startTime ? s.startTime.substring(0, 5) : '—';
    const endTime = s.endTime ? s.endTime.substring(0, 5) : '—';

    return `
      <tr>
        <td><strong>#${s.id}</strong></td>
        <td><strong>${s.movieTitle || 'Movie'}</strong></td>
        <td>${s.theatreName || 'Cinema'} <div style="font-size: 0.75rem; color: var(--text-dim);">${s.screenName || 'Screen'}</div></td>
        <td>${s.showDate}</td>
        <td><strong>${startTime}</strong> <span style="color: var(--text-dim); font-size: 0.8rem;">- ${endTime}</span></td>
        <td><strong style="color: var(--accent-emerald);">₹${s.ticketPrice}</strong></td>
        <td>
          <button class="btn btn-secondary btn-sm" style="padding: 4px 10px; font-size: 0.75rem;" onclick="inspectSpecificShow(${s.id})">
            Audit Seats & Tickets
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function calculateManagerEndTime() {
  const movieSelect = document.getElementById('sch-movie-id');
  const startTimeInput = document.getElementById('sch-start-time');
  const endTimeInput = document.getElementById('sch-end-time');

  if (!movieSelect || !startTimeInput || !endTimeInput) return;

  const movieId = Number(movieSelect.value);
  const startTime = startTimeInput.value;
  if (!movieId || !startTime) return;

  const movie = managerState.movies.find(m => m.id === movieId);
  const duration = (movie && movie.durationMinutes) ? movie.durationMinutes : 120;

  const [hours, minutes] = startTime.split(':').map(Number);
  const totalStartMinutes = (hours * 60) + minutes;
  const totalEndMinutes = totalStartMinutes + duration + 15; // 15 min buffer

  const endH = Math.floor((totalEndMinutes / 60) % 24);
  const endM = Math.floor(totalEndMinutes % 60);

  endTimeInput.value = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

async function handleManagerScheduleShow(e) {
  e.preventDefault();
  const movieId = Number(document.getElementById('sch-movie-id').value);
  const screenId = Number(document.getElementById('sch-screen-id').value);
  const showDate = document.getElementById('sch-date').value;
  let startTime = document.getElementById('sch-start-time').value;
  let endTime = document.getElementById('sch-end-time').value;
  const ticketPrice = Number(document.getElementById('sch-price').value);

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
    e.target.reset();
    loadSchedulerTab();
    loadManagerOverview();
  } catch (err) {
    showToast(err.message || 'Failed to schedule show', 'error');
  }
}

// TAB 3: SHOW OCCUPANCY & AUDIENCE INSPECTOR
async function loadOccupancyTab() {
  const select = document.getElementById('occupancy-show-select');
  if (!select) return;

  if (managerState.shows.length === 0) {
    try {
      managerState.shows = (await API.shows.getAll()) || [];
    } catch {}
  }

  let html = '<option value="">Select a Scheduled Show...</option>';
  html += managerState.shows.map(s => {
    return `<option value="${s.id}">#${s.id} — ${s.movieTitle} (${s.showDate} at ${s.startTime ? s.startTime.substring(0, 5) : ''}) • ${s.screenName}</option>`;
  }).join('');
  select.innerHTML = html;

  if (managerState.selectedShowId) {
    select.value = managerState.selectedShowId;
    loadShowOccupancyDetails();
  }
}

async function loadShowOccupancyDetails() {
  const select = document.getElementById('occupancy-show-select');
  const showId = select ? select.value : managerState.selectedShowId;

  const banner = document.getElementById('occupancy-details-banner');
  const seatmapWrap = document.getElementById('occupancy-seatmap-wrap');
  const bookingsWrap = document.getElementById('occupancy-bookings-wrap');
  const placeholder = document.getElementById('occupancy-placeholder');

  if (!showId) {
    if (banner) banner.style.display = 'none';
    if (seatmapWrap) seatmapWrap.style.display = 'none';
    if (bookingsWrap) bookingsWrap.style.display = 'none';
    if (placeholder) placeholder.style.display = 'block';
    return;
  }

  if (placeholder) placeholder.style.display = 'none';
  if (banner) banner.style.display = 'block';
  if (seatmapWrap) seatmapWrap.style.display = 'block';
  if (bookingsWrap) bookingsWrap.style.display = 'block';

  try {
    const [show, bookings, availableSeats] = await Promise.all([
      API.shows.getById(showId),
      API.bookings.getByShow(showId),
      API.bookings.getAvailableSeats(showId),
    ]);

    // Populate Banner
    document.getElementById('occ-movie-title').textContent = show.movieTitle || 'Movie Screening';
    document.getElementById('occ-meta-info').textContent =
      `${show.theatreName || 'Cinema'} • ${show.screenName || 'Screen'} • Date: ${show.showDate} • Time: ${show.startTime ? show.startTime.substring(0, 5) : ''} - ${show.endTime ? show.endTime.substring(0, 5) : ''} • Price: ₹${show.ticketPrice}`;

    // Compute Occupancy
    const confirmedBookings = (bookings || []).filter(b => b.status === 'CONFIRMED');
    const totalRev = confirmedBookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);

    // Fetch all screen seats to determine total capacity
    let allSeats = [];
    try {
      allSeats = (await API.seats.getByScreen(show.screenId)) || [];
    } catch {}

    const totalSeatsCount = allSeats.length || (show.totalSeats || 32);
    const availableSeatIds = new Set((availableSeats || []).map(s => s.seatId || s.id));
    const bookedSeatsCount = totalSeatsCount - (availableSeats || []).length;
    const occRate = totalSeatsCount > 0 ? Math.round((Math.max(0, bookedSeatsCount) / totalSeatsCount) * 100) : 0;

    document.getElementById('occ-rate').textContent = `${occRate}%`;
    document.getElementById('occ-ratio').textContent = `${Math.max(0, bookedSeatsCount)} / ${totalSeatsCount}`;
    document.getElementById('occ-revenue').textContent = `₹${totalRev.toLocaleString('en-IN')}`;

    // Render Seat Map
    renderOccupancySeatGrid(allSeats, availableSeatIds);

    // Render Audience Bookings Roster
    renderOccupancyBookings(bookings || [], showId);

  } catch (err) {
    showToast('Failed to load show occupancy: ' + err.message, 'error');
  }
}

function renderOccupancySeatGrid(allSeats, availableSeatIds) {
  const container = document.getElementById('occupancy-seat-grid');
  if (!container) return;

  if (allSeats.length === 0) {
    container.innerHTML = '<div style="color: var(--text-muted); padding: 20px;">No physical seats configured for this screen. Go to Seat Builder to generate.</div>';
    return;
  }

  // Determine cols count for grid
  const cols = Math.max(...allSeats.map(s => s.col || 8), 8);
  container.style.gridTemplateColumns = `repeat(${cols}, 34px)`;

  container.innerHTML = allSeats.map(s => {
    const isAvail = availableSeatIds.has(s.id || s.seatId);
    const tier = s.seatType || 'REGULAR';

    if (isAvail) {
      return `
        <div class="m-seat-cell available ${tier}" title="${s.seatNumber} (${tier} - Available)">
          ${s.seatNumber}
        </div>
      `;
    } else {
      return `
        <div class="m-seat-cell booked" title="${s.seatNumber} (Booked / Occupied)">
          ${s.seatNumber}
        </div>
      `;
    }
  }).join('');
}

function renderOccupancyBookings(bookings, showId) {
  const tbody = document.getElementById('occupancy-bookings-tbody');
  if (!tbody) return;

  if (bookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">No customer bookings recorded for this showtime yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = bookings.map(b => {
    const seatList = (b.seats || []).map(s => s.seatNumber).join(', ') || 'N/A';

    return `
      <tr>
        <td><strong>#${b.bookingId}</strong></td>
        <td>
          <div style="font-weight: 600;">${b.userName || 'Customer'}</div>
        </td>
        <td><code>#${b.userId || '—'}</code></td>
        <td><span style="color: var(--accent-gold); font-weight: 700;">${seatList}</span></td>
        <td><strong style="color: var(--accent-emerald);">₹${b.totalPrice}</strong></td>
        <td><span class="status-pill ${b.status}">${b.status}</span></td>
        <td>
          ${b.status === 'CONFIRMED' ? `
            <button class="btn btn-secondary btn-sm" style="color: #f87171; border-color: rgba(239, 68, 68, 0.4); padding: 4px 8px; font-size: 0.75rem;" 
                    onclick="handleManagerCancelBooking(${b.bookingId}, ${showId})">
              Cancel Ticket
            </button>
          ` : '<span style="color: var(--text-dim); font-size: 0.75rem;">Cancelled</span>'}
        </td>
      </tr>
    `;
  }).join('');
}

async function handleManagerCancelBooking(bookingId, showId) {
  if (!confirm(`Cancel Booking #${bookingId}? Customer seats will be returned to inventory.`)) return;

  try {
    await API.bookings.cancel(bookingId);
    showToast(`Booking #${bookingId} cancelled successfully`, 'info');
    loadShowOccupancyDetails();
  } catch (err) {
    showToast('Failed to cancel booking: ' + err.message, 'error');
  }
}

// TAB 4: SEAT BUILDER
async function loadSeatBuilderTab() {
  populateMgrScreenDropdown('seat-builder-screen-select');
  loadScreenSeats();
}

async function loadScreenSeats() {
  const select = document.getElementById('seat-builder-screen-select');
  const screenId = select ? select.value : null;

  const grid = document.getElementById('screen-seats-grid');
  const countEl = document.getElementById('seat-counts-summary');
  if (!grid) return;

  if (!screenId) {
    grid.innerHTML = '<div style="color: var(--text-muted); padding: 40px;">Select a screen auditorium above to inspect layout.</div>';
    if (countEl) countEl.textContent = '0 Seats Total';
    return;
  }

  grid.innerHTML = '<div style="color: var(--text-muted); padding: 40px;">Loading screen seats...</div>';

  try {
    const seats = await API.seats.getByScreen(screenId);
    managerState.currentScreenSeats = seats || [];

    if (countEl) {
      const vip = managerState.currentScreenSeats.filter(s => s.seatType === 'VIP').length;
      const prem = managerState.currentScreenSeats.filter(s => s.seatType === 'PREMIUM').length;
      const reg = managerState.currentScreenSeats.filter(s => s.seatType === 'REGULAR').length;
      countEl.textContent = `${managerState.currentScreenSeats.length} Seats (${vip} VIP, ${prem} Premium, ${reg} Regular)`;
    }

    if (managerState.currentScreenSeats.length === 0) {
      grid.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
          <h4>No seats created for this auditorium</h4>
          <p style="margin-top: 6px; font-size: 0.85rem;">Use the "Automated Seat Generator" on the left to create 32 standard seats in 1 click!</p>
        </div>
      `;
      return;
    }

    const cols = Math.max(...managerState.currentScreenSeats.map(s => s.col || 8), 8);
    grid.style.gridTemplateColumns = `repeat(${cols}, 34px)`;

    grid.innerHTML = managerState.currentScreenSeats.map(s => `
      <div class="m-seat-cell available ${s.seatType || 'REGULAR'}" title="${s.seatNumber} (${s.seatType})">
        ${s.seatNumber}
      </div>
    `).join('');

  } catch (err) {
    grid.innerHTML = `<div style="color: #f87171; padding: 20px;">Failed to load seats: ${err.message}</div>`;
  }
}

async function handleAutoGenerateSeats() {
  const select = document.getElementById('seat-builder-screen-select');
  const screenId = select ? select.value : null;

  if (!screenId) {
    showToast('Please select a screen auditorium first', 'info');
    return;
  }

  if (!confirm('Generate 32 standard seats (Rows A & B: VIP, Row C: PREMIUM, Row D: REGULAR)?')) return;

  const seatPlan = [];
  // Row A & B: VIP
  for (const row of ['A', 'B']) {
    for (let col = 1; col <= 8; col++) {
      seatPlan.push({ seatNumber: `${row}${col}`, row, col, seatType: 'VIP', screenId: Number(screenId) });
    }
  }
  // Row C: PREMIUM
  for (let col = 1; col <= 8; col++) {
    seatPlan.push({ seatNumber: `C${col}`, row: 'C', col, seatType: 'PREMIUM', screenId: Number(screenId) });
  }
  // Row D: REGULAR
  for (let col = 1; col <= 8; col++) {
    seatPlan.push({ seatNumber: `D${col}`, row: 'D', col, seatType: 'REGULAR', screenId: Number(screenId) });
  }

  showToast('Creating 32 seats for this auditorium...', 'info');

  try {
    const promises = seatPlan.map(s => API.seats.add(s));
    await Promise.allSettled(promises);
    showToast('Standard 32-seat layout generated successfully!', 'success');
    loadScreenSeats();
  } catch (err) {
    showToast('Error generating seats: ' + err.message, 'error');
  }
}

async function handleManualAddSeat(e) {
  e.preventDefault();
  const select = document.getElementById('seat-builder-screen-select');
  const screenId = select ? Number(select.value) : null;

  if (!screenId) {
    showToast('Please select a screen auditorium first', 'info');
    return;
  }

  const row = document.getElementById('seat-row-input').value.trim().toUpperCase();
  const col = Number(document.getElementById('seat-col-input').value);
  const seatNumber = document.getElementById('seat-number-input').value.trim().toUpperCase();
  const seatType = document.getElementById('seat-type-input').value;

  try {
    await API.seats.add({ seatNumber, row, col, seatType, screenId });
    showToast(`Seat ${seatNumber} added to auditorium!`, 'success');
    e.target.reset();
    loadScreenSeats();
  } catch (err) {
    showToast(err.message || 'Failed to add seat', 'error');
  }
}

// TAB 5: THEATERS & SCREENS
async function loadManagerTheaters() {
  const container = document.getElementById('mgr-theaters-container');
  if (!container) return;
  container.innerHTML = '<div style="color: var(--text-muted); padding: 30px;">Loading theaters & screens...</div>';

  try {
    const [theaters, screens, cities] = await Promise.all([
      API.theaters.getAll(),
      API.screens.getAll(),
      API.cities.getAll(),
    ]);

    managerState.theaters = theaters || [];
    managerState.screens = screens || [];
    managerState.cities = cities || [];

    if (managerState.theaters.length === 0) {
      container.innerHTML = '<div style="color: var(--text-muted); padding: 30px;">No theaters registered yet.</div>';
      return;
    }

    container.innerHTML = managerState.theaters.map(t => {
      const theaterScreens = managerState.screens.filter(s => String(s.theaterId) === String(t.id));
      const cityName = (managerState.cities.find(c => c.id === t.cityId) || {}).name || 'City';

      return `
        <div class="dash-panel" style="padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div>
              <h3 style="font-size: 1.1rem; margin-bottom: 4px;">${t.name}</h3>
              <div style="font-size: 0.8rem; color: var(--text-muted);">📍 ${t.address || ''}, ${cityName}</div>
            </div>
            <span class="dash-badge manager" style="font-size: 0.7rem;">${theaterScreens.length} Screens</span>
          </div>

          <div style="margin-top: 14px; border-top: 1px solid var(--border-subtle); padding-top: 12px;">
            <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-dim); margin-bottom: 8px; font-weight: 700;">Auditoriums / Screens:</div>
            ${theaterScreens.length > 0 ? `
              <div style="display: flex; flex-direction: column; gap: 6px;">
                ${theaterScreens.map(s => `
                  <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255, 255, 255, 0.03); padding: 6px 10px; border-radius: var(--radius-sm); font-size: 0.8rem;">
                    <span>🖥️ ${s.name}</span>
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

async function handleManagerCreateTheater(e) {
  e.preventDefault();
  const name = document.getElementById('mgr-th-name').value.trim();
  const address = document.getElementById('mgr-th-address').value.trim();
  const cityId = Number(document.getElementById('mgr-th-city-id').value);

  try {
    await API.theaters.add({ name, address, cityId });
    showToast(`Theater "${name}" created!`, 'success');
    closeManagerModal('modal-mgr-theater');
    e.target.reset();
    loadManagerTheaters();
    loadManagerOverview();
  } catch (err) {
    showToast(err.message || 'Failed to create theater', 'error');
  }
}

async function handleManagerCreateScreen(e) {
  e.preventDefault();
  const name = document.getElementById('mgr-sc-name').value.trim();
  const theaterId = Number(document.getElementById('mgr-sc-theater-id').value);
  const totalSeats = Number(document.getElementById('mgr-sc-total-seats').value);

  try {
    await API.screens.add({ name, theaterId, totalSeats });
    showToast(`Screen "${name}" added!`, 'success');
    closeManagerModal('modal-mgr-screen');
    e.target.reset();
    loadManagerTheaters();
    loadManagerOverview();
  } catch (err) {
    showToast(err.message || 'Failed to create screen', 'error');
  }
}

// TAB 6: MOVIES CATALOG
async function loadManagerMovies() {
  try {
    const list = await API.movies.getAll();
    managerState.movies = list || [];
    populateMgrMovieDropdown('sch-movie-id');

    const container = document.getElementById('mgr-movies-container');
    if (!container) return;

    if (managerState.movies.length === 0) {
      container.innerHTML = '<div style="color: var(--text-muted); padding: 30px;">No movies found. Click "+ Add Movie" to register one.</div>';
      return;
    }

    container.innerHTML = managerState.movies.map(m => `
      <div class="movie-manage-card">
        <img src="${m.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600'}" alt="${m.title}" class="movie-manage-thumb" onerror="this.src='https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600'">
        <div class="movie-manage-body">
          <div class="movie-manage-title">${m.title}</div>
          <div class="movie-manage-meta">
            <span style="color: var(--accent-gold);">⭐ ${m.rating || 0}/10</span>
            <span>•</span>
            <span>${m.durationMinutes || 120} min</span>
            <span>•</span>
            <span>${m.genre || 'Genre'}</span>
          </div>
          <p style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${m.description || 'No description available.'}
          </p>
          <div class="movie-manage-actions">
            <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="openManagerEditMovieModal(${m.id})">Edit Details</button>
            <button class="btn btn-primary btn-sm" onclick="scheduleMovieShortcut(${m.id})">Schedule</button>
          </div>
        </div>
      </div>
    `).join('');

  } catch (err) {
    container.innerHTML = `<div style="color: #f87171; padding: 20px;">Failed to load movies: ${err.message}</div>`;
  }
}

function scheduleMovieShortcut(movieId) {
  switchManagerTab('scheduler');
  const select = document.getElementById('sch-movie-id');
  if (select) {
    select.value = movieId;
    calculateManagerEndTime();
  }
}

function openManagerEditMovieModal(movieId) {
  const movie = managerState.movies.find(m => m.id === movieId);
  if (!movie) return;

  document.getElementById('mgr-movie-modal-title').textContent = `Edit Movie: ${movie.title}`;
  document.getElementById('mgr-movie-edit-id').value = movie.id;
  document.getElementById('mgr-movie-title').value = movie.title || '';
  document.getElementById('mgr-movie-genre').value = movie.genre || '';
  document.getElementById('mgr-movie-lang').value = movie.language || '';
  document.getElementById('mgr-movie-duration').value = movie.durationMinutes || 120;
  document.getElementById('mgr-movie-rating').value = movie.rating || 8.0;
  document.getElementById('mgr-movie-release-date').value = movie.releaseDate || new Date().toISOString().split('T')[0];
  document.getElementById('mgr-movie-poster').value = movie.posterUrl || '';
  document.getElementById('mgr-movie-desc').value = movie.description || '';
  document.getElementById('mgr-movie-submit-btn').textContent = 'Update Movie';

  openManagerModal('modal-mgr-movie');
}

async function handleManagerSaveMovie(e) {
  e.preventDefault();
  const editId = document.getElementById('mgr-movie-edit-id').value;

  const movieData = {
    title: document.getElementById('mgr-movie-title').value.trim(),
    genre: document.getElementById('mgr-movie-genre').value.trim(),
    language: document.getElementById('mgr-movie-lang').value.trim(),
    durationMinutes: Number(document.getElementById('mgr-movie-duration').value),
    rating: Number(document.getElementById('mgr-movie-rating').value),
    releaseDate: document.getElementById('mgr-movie-release-date').value,
    posterUrl: document.getElementById('mgr-movie-poster').value.trim(),
    description: document.getElementById('mgr-movie-desc').value.trim(),
  };

  try {
    if (editId) {
      await API.movies.update(editId, movieData);
      showToast(`Updated "${movieData.title}"!`, 'success');
    } else {
      await API.movies.add(movieData);
      showToast(`Added "${movieData.title}" to catalog!`, 'success');
    }

    closeManagerModal('modal-mgr-movie');
    e.target.reset();
    document.getElementById('mgr-movie-edit-id').value = '';
    document.getElementById('mgr-movie-modal-title').textContent = 'Add Movie to Program';
    document.getElementById('mgr-movie-submit-btn').textContent = 'Save Movie';
    loadManagerMovies();
    loadManagerOverview();
  } catch (err) {
    showToast(err.message || 'Operation failed', 'error');
  }
}

// TAB 7: CUSTOMER & TICKET LOOKUP
async function handleLookupUser(e) {
  e.preventDefault();
  const id = Number(document.getElementById('lookup-user-id').value);
  const container = document.getElementById('user-lookup-result');
  if (!container) return;

  container.innerHTML = '<div style="color: var(--text-muted);">Searching user...</div>';

  try {
    const user = await API.auth.getUserById(id);
    container.innerHTML = `
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 18px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <div class="dash-user-avatar" style="width: 36px; height: 36px;">${(user.name || user.email)[0].toUpperCase()}</div>
          <div>
            <h4 style="margin: 0;">${user.name || 'User'}</h4>
            <span class="role-pill ${user.role}">${user.role}</span>
          </div>
        </div>
        <div style="font-size: 0.85rem; line-height: 1.6; color: var(--text-muted);">
          <div>Email: <strong style="color: var(--text-main);">${user.email}</strong></div>
          <div>Phone: <strong style="color: var(--text-main);">${user.phone || 'N/A'}</strong></div>
          <div>User Account ID: <strong>#${user.id}</strong></div>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div style="color: #f87171; padding: 12px;">User not found: ${err.message}</div>`;
  }
}

async function handleLookupBooking(e) {
  e.preventDefault();
  const id = Number(document.getElementById('lookup-booking-id').value);
  const container = document.getElementById('booking-lookup-result');
  if (!container) return;

  container.innerHTML = '<div style="color: var(--text-muted);">Searching ticket...</div>';

  try {
    const b = await API.bookings.getById(id);
    const seatList = (b.seats || []).map(s => s.seatNumber).join(', ') || 'N/A';

    container.innerHTML = `
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 18px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div>
            <h4 style="margin: 0; font-size: 1.1rem;">${b.movieTitle || 'Movie Ticket'}</h4>
            <div style="color: var(--text-dim); font-size: 0.8rem;">Booking #${b.bookingId}</div>
          </div>
          <span class="status-pill ${b.status}">${b.status}</span>
        </div>
        <div style="font-size: 0.85rem; line-height: 1.6; color: var(--text-muted);">
          <div>Customer: <strong style="color: var(--text-main);">${b.userName || 'Customer'}</strong> (User #${b.userId || '—'})</div>
          <div>Cinema: <strong style="color: var(--text-main);">${b.theatreName || 'Cinema'}</strong> — ${b.screenName || 'Screen'}</div>
          <div>Seats: <strong style="color: var(--accent-gold); font-size: 0.95rem;">${seatList}</strong></div>
          <div>Showtime: <strong style="color: var(--text-main);">${b.showStartTime ? new Date(b.showStartTime).toLocaleString('en-IN') : '—'}</strong></div>
          <div>Total Paid: <strong style="color: var(--accent-emerald); font-size: 1rem;">₹${b.totalPrice}</strong></div>
        </div>
        ${b.status === 'CONFIRMED' ? `
          <div style="margin-top: 14px; border-top: 1px solid var(--border-subtle); padding-top: 12px;">
            <button class="btn btn-secondary btn-sm" style="color: #f87171; border-color: rgba(239, 68, 68, 0.4);" onclick="handleManagerCancelBooking(${b.bookingId}, null)">
              Cancel This Ticket
            </button>
          </div>
        ` : ''}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div style="color: #f87171; padding: 12px;">Booking ticket not found: ${err.message}</div>`;
  }
}

// ==========================================================================
// DROPDOWN POPULATORS
// ==========================================================================
function populateMgrCityDropdown(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  let html = '<option value="">Select City</option>';
  html += managerState.cities.map(c => `<option value="${c.id}">${c.name}, ${c.state}</option>`).join('');
  select.innerHTML = html;
}

function populateMgrTheaterDropdown(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  let html = '<option value="">Select Theater</option>';
  html += managerState.theaters.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  select.innerHTML = html;
}

function populateMgrScreenDropdown(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  let html = '<option value="">Select Screen Auditorium</option>';
  html += managerState.screens.map(s => {
    const theater = managerState.theaters.find(t => t.id === s.theaterId);
    return `<option value="${s.id}">${theater ? theater.name + ' — ' : ''}${s.name}</option>`;
  }).join('');
  select.innerHTML = html;
}

function populateMgrMovieDropdown(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  let html = '<option value="">Select Movie</option>';
  html += managerState.movies.map(m => `<option value="${m.id}">${m.title} (${m.durationMinutes || 120} min)</option>`).join('');
  select.innerHTML = html;
}

function handleManagerSearch(query) {
  const q = (query || '').toLowerCase().trim();
  const currentTab = managerState.currentTab;

  switch (currentTab) {
    case 'overview': {
      const tbody = document.getElementById('mgr-overview-shows-tbody');
      if (!tbody) break;
      const filtered = (managerState.todayShows || []).filter(s =>
        !q ||
        String(s.id).includes(q) ||
        (s.movieTitle && s.movieTitle.toLowerCase().includes(q)) ||
        (s.theatreName && s.theatreName.toLowerCase().includes(q)) ||
        (s.screenName && s.screenName.toLowerCase().includes(q))
      );
      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">No matching shows scheduled today.</td></tr>`;
        break;
      }
      tbody.innerHTML = filtered.map(s => `
        <tr>
          <td><strong>#${s.id}</strong></td>
          <td><strong>${s.movieTitle || 'Movie'}</strong></td>
          <td>${s.theatreName || 'Cinema'} <span style="color: var(--text-dim);">(${s.screenName || 'Screen'})</span></td>
          <td><strong>${s.startTime ? s.startTime.substring(0, 5) : '—'}</strong></td>
          <td><strong style="color: var(--accent-emerald);">₹${s.ticketPrice}</strong></td>
          <td><span class="status-pill ${s.status || 'ACTIVE'}">${s.status || 'ACTIVE'}</span></td>
          <td>
            <button class="btn btn-secondary btn-sm" style="padding: 4px 8px; font-size: 0.75rem;" 
                    onclick="inspectShowShortcut(${s.id})">Audience & Seats</button>
          </td>
        </tr>
      `).join('');
      break;
    }
    case 'movies': {
      const container = document.getElementById('mgr-movies-container');
      if (!container) break;
      const filtered = (managerState.movies || []).filter(m =>
        !q ||
        (m.title && m.title.toLowerCase().includes(q)) ||
        (m.genre && m.genre.toLowerCase().includes(q)) ||
        (m.language && m.language.toLowerCase().includes(q))
      );
      if (filtered.length === 0) {
        container.innerHTML = `<div style="color: var(--text-muted); padding: 20px;">No movies matching "${query}".</div>`;
        break;
      }
      container.innerHTML = filtered.map(m => `
        <div class="dash-panel" style="padding: 16px; display: flex; gap: 16px;">
          ${m.posterUrl
            ? `<img src="${m.posterUrl}" alt="${m.title}" style="width: 70px; height: 100px; object-fit: cover; border-radius: var(--radius-sm);" onerror="this.onerror=null; this.style.display='none';" />`
            : `<div style="width: 70px; height: 100px; background: #1e293b; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: var(--text-dim);">FILM</div>`
          }
          <div style="flex: 1;">
            <h4 style="font-size: 1rem; margin-bottom: 4px;">${m.title}</h4>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px;">
              <span>⭐ ${m.rating || 0}/10</span> • <span>${m.genre || 'Genre'}</span> • <span>${m.durationMinutes || 120} min</span>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-secondary btn-sm" onclick="openManagerEditMovieModal(${m.id})">Edit</button>
              <button class="btn btn-primary btn-sm" onclick="scheduleMovieShortcut(${m.id})">Schedule</button>
            </div>
          </div>
        </div>
      `).join('');
      break;
    }
  }
}

// ==========================================================================
// DOM INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  const authed = checkManagerAuth();
  if (authed) {
    refreshAllManagerData();
  }
});
