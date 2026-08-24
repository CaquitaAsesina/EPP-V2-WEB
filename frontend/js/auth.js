// Auth Module
const Auth = {  isLoggedIn() {
    return !!localStorage.getItem('token');
  },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  },

  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  },

  getToken() {
    return localStorage.getItem('token');
  },

  isAdmin() {
    const user = this.getUser();
    return user && user.role === 'admin';
  },

  login(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  logout() {
    if (document.getElementById('loadingOverlay')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'loadingOverlay';
    overlay.innerHTML = `
      <div class="loading-ring-wrap">
        <svg class="loading-ring-svg" viewBox="0 0 160 160">
          <circle class="loading-ring-bg" cx="80" cy="80" r="70"/>
          <circle class="loading-ring-progress" id="loadingRing" cx="80" cy="80" r="70"/>
        </svg>
        <img src="/img/logo.svg" class="loading-logo-inner" alt="">
      </div>
      <div class="loading-percent"><span id="loadingPercent">0</span><span class="pct">%</span></div>
      <div class="loading-status" id="loadingStatus"></div>
    `;
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.classList.add('show');

      const percentEl = document.getElementById('loadingPercent');
      const ringEl = document.getElementById('loadingRing');
      const statusEl = document.getElementById('loadingStatus');
      const circumference = 2 * Math.PI * 70;

      ringEl.style.strokeDasharray = circumference;
      ringEl.style.strokeDashoffset = circumference;

      const stages = [
        { at: 20, text: 'Cerrando sesión' },
        { at: 50, text: 'Guardando datos' }
      ];

      let current = 0;
      let stageIdx = 0;
      const duration = 1400;
      const step = 16;
      const total = duration / step;

      function tick() {
        current++;
        const progress = current / total;
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(eased * 100);

        percentEl.textContent = value;
        ringEl.style.strokeDashoffset = circumference - (eased * circumference);

        if (stageIdx < stages.length && value >= stages[stageIdx].at) {
          statusEl.textContent = stages[stageIdx].text;
          stageIdx++;
        }

        if (current < total) {
          requestAnimationFrame(tick);
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/html/login.html';
        }
      }
      requestAnimationFrame(tick);
    });
  },

  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = '/html/login.html';
      return false;
    }
    return true;
  },

  requireAdmin() {
    if (!this.requireAuth()) return false;
    if (!this.isAdmin()) {
      window.location.href = '/index.html#/dashboard';
      return false;
    }
    return true;
  },

  initUserMenu() {
    const user = this.getUser();
    if (!user) return;
    const avatarEls = document.querySelectorAll('.user-avatar');
    const nameEls = document.querySelectorAll('.user-name');
    const roleEls = document.querySelectorAll('.user-role');
    avatarEls.forEach(el => el.textContent = user.full_name?.charAt(0)?.toUpperCase() || 'U');
    nameEls.forEach(el => el.textContent = user.full_name);
    roleEls.forEach(el => el.textContent = user.role === 'admin' ? 'Administrador' : 'Lector');
  }
};

/* Exponer para otros módulos y vistas (SPA) */
window.Auth = Auth;
