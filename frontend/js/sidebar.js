// Sidebar Module
const Sidebar = {
  init() {
    this.highlightActive();
    this.initMobile();
  },

  highlightActive() {
    const path = window.location.pathname;
    const filename = path.split('/').pop();
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === filename || link.getAttribute('href') === `/html/${filename}`) {
        link.classList.add('active');
      }
    });
  },

  initMobile() {
    const toggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (toggle && sidebar) {
      toggle.addEventListener('click', () => {
        sidebar.classList.toggle('show');
        overlay?.classList.toggle('show');
      });
    }

    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar?.classList.remove('show');
        overlay.classList.remove('show');
      });
    }
  },

  // Generate sidebar HTML
  render(activePage) {
    const user = Auth.getUser();
    const isAdmin = user?.role === 'admin';

    const links = [
      { section: 'Principal' },
      { href: 'dashboard.html', icon: 'bi-speedometer2', label: 'Dashboard', roles: ['admin', 'lector'] },
      { section: 'Períodos' },
      { href: 'periodos.html', icon: 'bi-calendar-range', label: 'Gestionar Períodos', roles: ['admin'] },
      { section: 'Inventario' },
      { href: 'inventario-limpio.html', icon: 'bi-shield-check', label: 'EPP Limpio', roles: ['admin', 'lector'] },
      { href: 'inventario-sucio.html', icon: 'bi-shield-exclamation', label: 'EPP Sucio / Lavado', roles: ['admin', 'lector'] },
      { section: 'Movimientos' },
      { href: 'ingresos.html', icon: 'bi-box-arrow-in-down', label: 'Ingresos', roles: ['admin'] },
      { href: 'entregas.html', icon: 'bi-box-arrow-up', label: 'Entregas', roles: ['admin'] },
      { href: 'devoluciones.html', icon: 'bi-arrow-return-left', label: 'Devoluciones', roles: ['admin'] },
      { section: 'Análisis' },
      { href: 'consultas.html', icon: 'bi-search', label: 'Consultas y Reportes', roles: ['admin', 'lector'] },
    ];

    if (isAdmin) {
      links.push({ section: 'Sistema' });
      links.push({ href: 'perfil.html', icon: 'bi-gear', label: 'Administración', roles: ['admin'] });
    }

    let html = '';
    links.forEach(link => {
      if (link.section) {
        html += `<div class="nav-section">${link.section}</div>`;
      } else if (link.roles.includes(user?.role || 'admin')) {
        const active = activePage === link.href ? 'active' : '';
        html += `<a href="${link.href}" class="${active}"><i class="bi ${link.icon}"></i><span>${link.label}</span></a>`;
      }
    });

    const navEl = document.querySelector('.sidebar-nav');
    if (navEl) navEl.innerHTML = html;
  }
};
