/* ============================================
   Layout + FX Engine — Farmacias Peruanas Edition
   Splash · Ripple · Spotlight · Action Popups
   Page Transitions · Count-Up · Branding
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
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (!sidebar) return;

    const close = () => {
      sidebar.classList.remove('open', 'show');
      if (overlay) { overlay.classList.remove('show'); setTimeout(() => { if (overlay) overlay.style.display = 'none'; }, 260); }
    };
    const open = () => {
      sidebar.classList.add('open', 'show');
      if (overlay) { overlay.style.display = 'block'; requestAnimationFrame(() => overlay.classList.add('show')); }
    };

    document.querySelectorAll('#sidebarToggle, #menuToggle').forEach(toggle => {
      toggle.addEventListener('click', () => {
        const isOpen = sidebar.classList.contains('open') || sidebar.classList.contains('show');
        isOpen ? close() : open();
      });
    });

    if (overlay) overlay.addEventListener('click', close);
  },

  // === Theme ===
  initTheme() {
    const saved = localStorage.getItem('epp-theme') || 'light';
    this.setTheme(saved);
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

/* ============================================================
   FX — Motor de animaciones Farmacias Peruanas
   ============================================================ */
const FX = {
  _dismissed: false,

  sections: {
    'dashboard': 'Principal',
    'periodos': 'Control',
    'inventario-limpio': 'Inventario',
    'inventario-sucio': null,
    'entregas': 'Movimientos',
    'ingresos': null,
    'devoluciones': null,
    'trabajadores': 'Personal',
    'consultas': 'Análisis',
    'perfil': 'Sistema'
  },

  iconActions: {
    'bi-pencil': 'Editando registro',
    'bi-pencil-square': 'Editando registro',
    'bi-trash': 'Eliminando registro',
    'bi-lock': 'Cerrando período',
    'bi-lock-fill': 'Cerrando período',
    'bi-play-circle': 'Activando',
    'bi-plus-lg': 'Nuevo registro',
    'bi-plus': 'Nuevo registro',
    'bi-list': 'Menú',
    'bi-person-circle': 'Menú de usuario',
    'bi-search': 'Buscando',
    'bi-arrow-clockwise': 'Actualizando datos',
    'bi-download': 'Descargando',
    'bi-file-earmark-excel': 'Exportando a Excel',
    'bi-eye': 'Ver detalles',
    'bi-check-lg': 'Confirmando',
    'bi-x-lg': 'Cerrando',
    'bi-funnel': 'Filtrando',
    'bi-arrow-repeat': 'Actualizando',
    'bi-box-arrow-right': 'Saliendo',
    'bi-gear': 'Configuración',
    'bi-moon': 'Modo oscuro',
    'bi-sun': 'Modo claro'
  },

  init() {
    // Cada FX en guardía: si uno falla, el resto y el reveal siguen funcionando
    ['brandSidebar', 'organizeNav', 'injectSidebarFooter', 'injectPageFooter',
     'injectActionPop', 'staggerReveal', 'initRipple', 'initSpotlight',
     'initActionPopups', 'initPageTransitions', 'initCountUp'
    ].forEach(fn => {
      try { this[fn](); } catch (err) { console.warn('FX:' + fn, err); }
    });
  },

  /* ---------- helpers ---------- */
  textOf(el) {
    if (!el) return '';
    const clone = el.cloneNode(true);
    clone.querySelectorAll('i, svg, span.fp-ripple').forEach(n => n.remove());
    return (clone.textContent || '').replace(/\s+/g, ' ').trim();
  },
  iconOf(el) {
    const i = el && el.querySelector('i[class*="bi-"]');
    if (!i) return '';
    return (i.className.match(/bi-[a-z0-9-]+/) || [''])[0];
  },

  /* ---------- splash / preloader ---------- */
  injectSplash() {
    if (this._dismissed) return;
    if (sessionStorage.getItem('fp-navigated')) {
      sessionStorage.removeItem('fp-navigated');
      return;
    }
    const splash = document.createElement('div');
    splash.id = 'fpSplash';
    splash.innerHTML = `
      <div class="fp-splash-logo"><i class="bi bi-capsule"></i></div>
      <div class="fp-splash-title">EPP <em>Control</em></div>
      <div class="fp-splash-sub">Farmacias Peruanas</div>
      <div class="fp-splash-bar"><span></span></div>
    `;
    document.body.prepend(splash);

    let done = false;
    const dismiss = () => {
      if (done) return;
      done = true;
      this._dismissed = true;
      splash.classList.add('fp-splash-done');
      setTimeout(() => splash.remove(), 520);
    };
    if (document.readyState === 'complete') setTimeout(dismiss, 700);
    else window.addEventListener('load', () => setTimeout(dismiss, 700));
    setTimeout(dismiss, 3200);
  },

  /* ---------- branding del sidebar ---------- */
  brandSidebar() {
    const header = document.querySelector('.sidebar-header');
    if (!header || header.dataset.fpBranded) return;
    header.dataset.fpBranded = '1';
    const logo = header.querySelector('.sidebar-logo i');
    if (logo) logo.className = 'bi bi-capsule';
    const span = header.querySelector('span:not(.fp-brand-name):not(.fp-brand-sub)');
    if (span && !header.querySelector('.fp-brand-text')) {
      const brand = document.createElement('div');
      brand.className = 'fp-brand-text';
      brand.innerHTML = `
        <span class="fp-brand-name">${span.textContent.trim() || 'EPP Control'}</span>
        <span class="fp-brand-sub"><i class="bi bi-heart-pulse-fill"></i> Farmacias Peruanas</span>
      `;
      span.replaceWith(brand);
    }
    // rol para CSS (.admin-only)
    if (typeof Auth !== 'undefined' && Auth.getUser()) {
      document.documentElement.setAttribute('data-role', Auth.getUser().role || 'admin');
    }
  },

  /* ---------- secciones del menú (estilo referencia) ---------- */
  organizeNav() {
    const nav = document.querySelector('.sidebar-nav');
    if (!nav || nav.querySelector('.nav-section')) return;
    nav.querySelectorAll('a.nav-link').forEach(link => {
      const href = (link.getAttribute('href') || '').split('/').pop()
        .replace(/^#\/?/, '').replace(/\.html$/, '');
      const section = this.sections[href];
      if (section && !link.previousElementSibling?.classList?.contains('nav-section')) {
        const div = document.createElement('div');
        div.className = 'nav-section';
        div.textContent = section;
        nav.insertBefore(div, link);
      }
    });
  },

  /* ---------- footer del sidebar (píldora de usuario) ---------- */
  injectSidebarFooter() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar || sidebar.querySelector('.sidebar-footer')) return;
    if (typeof Auth === 'undefined' || !Auth.getUser()) return;
    const user = Auth.getUser();
    const initial = (user.full_name || user.username || 'U').charAt(0).toUpperCase();
    const role = user.role === 'admin' ? 'Administrador' : 'Lector';

    const footer = document.createElement('div');
    footer.className = 'sidebar-footer';
    footer.innerHTML = `
      <div class="sidebar-user" title="Ver perfil">
        <div class="sidebar-user-avatar">${initial}</div>
        <div class="sidebar-user-info">
          <div class="sidebar-user-name">${user.full_name || user.username || 'Usuario'}</div>
          <div class="sidebar-user-role">${role}</div>
        </div>
        <i class="bi bi-chevron-right"></i>
      </div>
      <div class="fp-sidebar-footer-brand">© Farmacias <em>Peruanas</em></div>
    `;
    sidebar.appendChild(footer);

    footer.querySelector('.sidebar-user').addEventListener('click', () => {
      this.showPop('Abriendo tu perfil', 'bi-person-badge');
      if (window.Router) window.Router.go('perfil');
      else this.wipeTo('/html/perfil.html');
    });
  },

  /* ---------- footer de página ---------- */
  injectPageFooter(root) {
    const wrapper = root || document.querySelector('.content-wrapper, .page-content');
    if (!wrapper || wrapper.querySelector('.fp-page-footer')) return;
    const footer = document.createElement('footer');
    footer.className = 'fp-page-footer';
    footer.innerHTML = `
      <span class="fp-footer-dot">Sistema en línea</span>
      <span>© 2026 <em>Farmacias Peruanas</em> · Control de Inventario EPP</span>
    `;
    wrapper.appendChild(footer);
  },

  /* ---------- reveal escalonado ---------- */
  staggerReveal(root) {
    const wrapper = root || document.querySelector('.content-wrapper, .page-content, .login-wrapper');
    if (!wrapper) return;
    const targets = wrapper.querySelectorAll(
      '.card, .stat-card, .kpi-card, .active-period-bar, .section-header, .filter-bar, .login-card'
    );
    targets.forEach((el, i) => {
      if (el.closest('.modal')) return;
      el.classList.add('fp-reveal');
      el.style.transitionDelay = Math.min(i * 70, 560) + 'ms';
    });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        targets.forEach(el => el.classList.add('fp-reveal-in'));
      });
    });
    setTimeout(() => targets.forEach(el => { el.style.transitionDelay = ''; }), 1400);
  },

  /* ---------- ripple en botones ---------- */
  initRipple() {
    document.addEventListener('click', (e) => {
      if (!e.target || !e.target.closest) return;
      const target = e.target.closest('.btn, .btn-icon, .nav-link, .dropdown-item, .sidebar-link, .sidebar-user, .btn-apple');
      if (!target || target.disabled) return;
      if (getComputedStyle(target).position === 'static') target.style.position = 'relative';
      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.15;
      const ripple = document.createElement('span');
      ripple.className = 'fp-ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      target.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  },

  /* ---------- spotlight que sigue el cursor en cards ---------- */
  initSpotlight() {
    document.addEventListener('pointermove', (e) => {
      const card = e.target.closest('.card, .stat-card, .kpi-card');
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width * 100) + '%');
      card.style.setProperty('--my', ((e.clientY - rect.top) / rect.height * 100) + '%');
    });
  },

  /* ---------- popup de acción ---------- */
  injectActionPop() {
    if (document.getElementById('fpActionPop')) return;
    const pop = document.createElement('div');
    pop.id = 'fpActionPop';
    document.body.appendChild(pop);
  },

  showPop(label, icon = 'bi-cursor-fill') {
    const pop = document.getElementById('fpActionPop');
    if (!pop || !label) return;
    pop.innerHTML = `<i class="bi ${icon}"></i><span>${label}</span>`;
    pop.classList.remove('fp-pop-show');
    void pop.offsetWidth;
    pop.classList.add('fp-pop-show');
  },

  getActionInfo(el) {
    const nav = el.closest('a.nav-link, .sidebar-link');
    if (nav) {
      return { label: 'Yendo a ' + (this.textOf(nav) || 'página'), icon: this.iconOf(nav) || 'bi-arrow-right-circle-fill' };
    }
    const drop = el.closest('.dropdown-item');
    if (drop) return { label: this.textOf(drop) || 'Acción', icon: this.iconOf(drop) || 'bi-cursor-fill' };

    const themeBtn = el.closest('#themeToggle, .theme-toggle');
    if (themeBtn) {
      const goingDark = document.documentElement.getAttribute('data-theme') !== 'dark';
      return { label: goingDark ? 'Activando modo oscuro' : 'Activando modo claro', icon: goingDark ? 'bi-moon-stars-fill' : 'bi-sun-fill' };
    }
    if (el.closest('#logoutBtn')) return { label: 'Cerrando sesión', icon: 'bi-box-arrow-right' };

    const btn = el.closest('button, a.btn, .btn-icon, [role="button"]');
    if (btn && !btn.disabled && !btn.hasAttribute('data-bs-dismiss')) {
      if (btn.getAttribute('data-bs-toggle') === 'dropdown') {
        return { label: 'Abriendo menú', icon: 'bi-menu-button-wide-fill' };
      }
      let label = this.textOf(btn) || btn.title || btn.getAttribute('aria-label') || '';
      let icon = this.iconOf(btn);
      if (!label && icon && this.iconActions[icon]) label = this.iconActions[icon];
      if (!label) return null;
      return { label: label.charAt(0).toUpperCase() + label.slice(1), icon: icon || 'bi-hand-index-thumb-fill' };
    }
    return null;
  },

  initActionPopups() {
    document.addEventListener('click', (e) => {
      if (!e.target || !e.target.closest) return;
      if (e.target.closest('.toast-apple, #fpSplash, .toast-close, .modal-backdrop-apple, [data-no-pop]')) return;
      if (e.target.closest('a[href$=".html"], a[href^="/html"]')) return; // los maneja la transición
      const info = this.getActionInfo(e.target);
      if (info) this.showPop(info.label, info.icon);
    }, true);
  },

  /* ---------- transición entre páginas (wipe rojo) ---------- */
  wipeTo(href, x, y) {
    try { sessionStorage.setItem('fp-navigated', '1'); } catch (err) { /* noop */ }
    const t = document.createElement('div');
    t.id = 'fpTransition';
    t.style.left = (x ?? window.innerWidth / 2) + 'px';
    t.style.top = (y ?? window.innerHeight / 2) + 'px';
    const scale = Math.hypot(window.innerWidth, window.innerHeight) * 2.2 / 24;
    t.style.setProperty('--wipe-scale', scale.toFixed(0));
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('fp-transition-run'));
    setTimeout(() => { window.location.href = href; }, 460);
  },

  initPageTransitions() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href') || '';
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || link.target === '_blank') return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const isInternal = href.endsWith('.html') || href.startsWith('/html');
      if (!isInternal) return;

      e.preventDefault();
      const nav = link.closest('a.nav-link, .sidebar-link');
      if (nav) this.showPop('Yendo a ' + (this.textOf(link) || 'página'), this.iconOf(link) || 'bi-arrow-right-circle-fill');
      this.wipeTo(href, e.clientX, e.clientY);
    });
  },

  /* ---------- count-up para KPIs ---------- */
  initCountUp() {
    const counters = document.querySelectorAll('.stat-info h3, .kpi-value');
    counters.forEach(el => {
      if (el.__fpCount) return;
      el.__fpCount = true;
      const mo = new MutationObserver(() => {
        if (el.__fpAnimating) return;
        const raw = (el.textContent || '').trim().replace(/[^\d-]/g, '');
        const num = parseInt(raw, 10);
        if (isNaN(num) || num === el.__fpLast) return;
        el.__fpLast = num;
        this.animateCount(el, num);
      });
      mo.observe(el, { childList: true, characterData: true, subtree: true });
    });
  },

  /* ---------- refresco tras cambiar de vista (SPA) ---------- */
  refreshView(root) {
    try {
      this.staggerReveal(root);
      this.injectPageFooter(root);
      this.initCountUp();
    } catch (err) { console.warn('FX:refreshView', err); }
  },

  animateCount(el, target) {
    el.__fpAnimating = true;
    const dur = 850;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('es-PE');
      if (p < 1) requestAnimationFrame(step);
      else { el.textContent = target.toLocaleString('es-PE'); el.__fpAnimating = false; }
    };
    requestAnimationFrame(step);
  }
};

/* Auto-init en todas las páginas (idempotente) */
document.addEventListener('DOMContentLoaded', () => {
  if (window.__FPFX) return;
  window.__FPFX = true;
  FX.injectSplash();
  FX.init();
});

/* Exponer para otros módulos (router, login) */
window.FX = FX;

/* Exponer para otros módulos y vistas (SPA) */
window.Layout = Layout;
