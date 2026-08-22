/* ============================================
   Layout Module - Theme Toggle + Sidebar + Logout
   ============================================ */

const Layout = {
  init() {
    this.initTheme();
    this.initSidebarToggle();
    this.initLogout();
    this.highlightActiveLink();
  },

  // === Active Link ===
  highlightActiveLink() {
    const current = window.location.pathname.split('/').pop();
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
      const href = link.getAttribute('href') || '';
      const isActive = href === current || (current === '' && href === 'dashboard.html');
      link.classList.toggle('active', isActive);
    });
  },

  // === Sidebar Mobile Toggle ===
  initSidebarToggle() {
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (!toggle || !sidebar) return;

    toggle.addEventListener('click', () => {
      const isOpen = sidebar.classList.contains('open');
      if (isOpen) {
        sidebar.classList.remove('open');
        if (overlay) { overlay.style.display = 'none'; overlay.classList.remove('show'); }
      } else {
        sidebar.classList.add('open');
        if (overlay) { overlay.style.display = 'block'; requestAnimationFrame(() => overlay.classList.add('show')); }
      }
    });

    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
        setTimeout(() => overlay.style.display = 'none', 250);
      });
    }
  },

  // === Theme ===
  initTheme() {
    const saved = localStorage.getItem('epp-theme') || 'light';
    this.setTheme(saved);

    // Bind ALL theme toggle buttons
    document.querySelectorAll('.theme-toggle, #themeToggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleTheme();
      });
    });
  },

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('epp-theme', theme);

    // Update all theme toggle icons
    document.querySelectorAll('.theme-toggle i, #themeToggle i').forEach(icon => {
      icon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon';
    });
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    this.setTheme(current === 'dark' ? 'light' : 'dark');
  },

  // === Logout ===
  initLogout() {
    document.querySelectorAll('#logoutBtn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof Auth !== 'undefined') Auth.logout();
      });
    });
  }
};
