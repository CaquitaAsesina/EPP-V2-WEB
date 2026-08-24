/* ============================================
   Router SPA — EPP Control · Farmacias Peruanas
   Carga cada módulo dentro de index.html
   (una sola carga de librerías, navegación instantánea)
   ============================================ */

const Router = {
  routes: {
    'dashboard':         { file: 'dashboard.html',        label: 'Dashboard' },
    'periodos':          { file: 'periodos.html',         label: 'Períodos',        admin: true },
    'inventario-limpio': { file: 'inventario-limpio.html', label: 'EPP Limpio' },
    'inventario-sucio':  { file: 'inventario-sucio.html',  label: 'EPP Sucio / Lavado' },
    'entregas':          { file: 'entregas.html',         label: 'Entregas',        admin: true },
    'ingresos':          { file: 'ingresos.html',         label: 'Ingresos',        admin: true },
    'devoluciones':      { file: 'devoluciones.html',     label: 'Devoluciones',    admin: true },
    'trabajadores':      { file: 'trabajadores.html',     label: 'Trabajadores' },
    'consultas':         { file: 'consultas.html',        label: 'Consultas y Reportes' },
    'mi-perfil':         { file: 'mi-perfil.html',        label: 'Mi Perfil' },
    'perfil':            { file: 'perfil.html',           label: 'Administración',  admin: true }
  },

  current: null,
  _version: 0,

  init() {
    window.addEventListener('hashchange', () => this.load());
    if (!location.hash) history.replaceState(null, '', '#/dashboard');
    this.load();
  },

  go(name) {
    if (!this.routes[name]) name = 'dashboard';
    if (this.parseHash() === name) {
      if (this.current !== name) this.load();
      return;
    }
    location.hash = '#/' + name;
  },

  parseHash() {
    const h = decodeURIComponent(location.hash || '').replace(/^#\/?/, '').replace(/\.html$/, '');
    return this.routes[h] ? h : 'dashboard';
  },

  setActive(name) {
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.route === name);
    });
  },

  async load() {
    const name = this.parseHash();
    this.setActive(name);

    const route = this.routes[name];
    if (route.admin && typeof Auth !== 'undefined' && !Auth.isAdmin()) {
      Utils.toast('No tienes permisos para este módulo', 'warning');
      if (name !== 'dashboard') { location.hash = '#/dashboard'; return; }
    }

    const version = ++this._version;
    const wrapper = document.getElementById('viewContainer');
    wrapper.classList.add('fp-view-out');

    try {
      const res = await fetch('/html/' + route.file);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const html = await res.text();
      if (version !== this._version) return;

      this.current = name;
      this.render(name, html);
      requestAnimationFrame(() => wrapper.classList.remove('fp-view-out'));
      window.scrollTo(0, 0);
    } catch (err) {
      if (version !== this._version) return;
      wrapper.classList.remove('fp-view-out');
      console.error('Router:', err);
      if (typeof Utils !== 'undefined') Utils.toast('Error al cargar el módulo: ' + err.message, 'error');
    }
  },

  render(name, html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    this.cleanup();

    /* Título + encabezado */
    document.title = (doc.title || 'EPP Control') + ' — Farmacias Peruanas';
    const h1 = doc.querySelector('.header-title h1');
    const sub = doc.querySelector('.header-title .text-muted');
    document.getElementById('viewTitle').textContent = h1 ? h1.textContent : this.routes[name].label;
    const subEl = document.getElementById('viewSubtitle');
    if (subEl) subEl.textContent = sub ? sub.textContent : '';

    /* Botones propios de la página en el header */
    const actions = document.getElementById('headerActions');
    actions.querySelectorAll('[data-fp-page]').forEach(n => n.remove());
    const themeBtn = actions.querySelector('.theme-toggle');
    [...doc.querySelectorAll('.header-actions > *')]
      .filter(el => !el.matches('.theme-toggle, .dropdown'))
      .forEach(el => {
        el.setAttribute('data-fp-page', '1');
        actions.insertBefore(el, themeBtn);
      });

    /* Contenido de la vista */
    const content = doc.querySelector('.content-wrapper, .page-content');
    const wrapper = document.getElementById('viewContainer');
    wrapper.innerHTML = content ? content.innerHTML :
      '<div class="empty-state"><i class="bi bi-wifi-off"></i><h5>Módulo no disponible</h5><p>No se pudo cargar el contenido del módulo.</p></div>';

    /* Estilos propios de la página (p. ej. inventario-sucio) */
    doc.querySelectorAll('head style, body style').forEach(styleEl => {
      styleEl.setAttribute('data-fp-view', '1');
      document.head.appendChild(styleEl);
    });

    /* Modales y otros elementos a nivel de body */
    doc.body.querySelectorAll(':scope > div').forEach(el => {
      if (el.id === 'layout' || el.id === 'sidebarOverlay') return;
      if (el.classList.contains('sidebar-overlay') || el.classList.contains('toast-container')) return;
      el.setAttribute('data-fp-view', '1');
      document.body.appendChild(el);
    });

    /* Script de la vista */
    this.runScript(doc);

    /* FX de entrada */
    if (window.FX) FX.refreshView(wrapper);
  },

  cleanup() {
    /* Destruir gráficos de la vista saliente */
    if (window.Chart && window.Chart.getChart) {
      document.querySelectorAll('#viewContainer canvas').forEach(c => {
        try { const ch = window.Chart.getChart(c); if (ch) ch.destroy(); } catch (e) { /* noop */ }
      });
    }
    /* Remover modales/estilos de la vista anterior */
    document.querySelectorAll('[data-fp-view]').forEach(n => n.remove());
    /* Cerrar restos de modales bootstrap */
    document.querySelectorAll('.modal-backdrop').forEach(n => n.remove());
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  },

  runScript(doc) {
    const codes = [...doc.querySelectorAll('script:not([src])')].map(s => s.textContent);
    let code = codes.join('\n;\n');
    /* Layout.init lo maneja el shell (evita listeners duplicados) */
    code = code.replace(/Layout\.init\s*\([^)]*\)\s*;?/g, ';');

    const origAdd = document.addEventListener.bind(document);
    document.addEventListener = function (type, fn, opts) {
      if (type === 'DOMContentLoaded') {
        setTimeout(() => {
          try { fn.call(document, new Event('DOMContentLoaded')); }
          catch (e) { console.error('View init:', e); }
        }, 0);
        return;
      }
      return origAdd(type, fn, opts);
    };

    try {
      (0, eval)(code);
    } catch (e) {
      console.error('Router script:', e);
      const msg = String(e && e.message || e);
      if (!/No auth/i.test(msg) && typeof Utils !== 'undefined') {
        Utils.toast('Error al inicializar el módulo: ' + msg, 'error');
      }
    } finally {
      document.addEventListener = origAdd;
    }
  }
};

/* Enlaces .html dentro del contenido → navegación SPA */
document.addEventListener('click', (e) => {
  if (!e.target || !e.target.closest) return;
  const link = e.target.closest('a[href]');
  if (!link || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || link.target === '_blank') return;
  const href = link.getAttribute('href') || '';
  const match = href.match(/^\/?html\/([a-z-]+)\.html$/) || href.match(/^([a-z-]+)\.html$/);
  if (!match) return;
  const name = match[1];
  if (!Router.routes[name]) return;
  e.preventDefault();
  e.stopPropagation();
  if (window.FX && FX.showPop) {
    FX.showPop('Yendo a ' + (Router.routes[name].label), 'bi-arrow-right-circle-fill');
  }
  Router.go(name);
}, true);

/* Exponer para otros módulos (layout.js, vistas) */
window.Router = Router;
