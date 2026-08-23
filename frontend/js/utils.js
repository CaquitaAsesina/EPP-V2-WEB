// Utils Module
const Utils = {
  // Toast notification system
  toast(message, type = 'success', duration = 4000) {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const icons = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' };

    const toast = document.createElement('div');
    toast.className = `toast-apple toast-${type}`;
    toast.innerHTML = `
      <i class="bi ${icons[type] || icons.info}"></i>
      <span class="toast-msg">${message}</span>
      <button class="toast-close" aria-label="Cerrar"><i class="bi bi-x-lg"></i></button>
      <span class="toast-progress" style="animation-duration:${duration}ms;"></span>
    `;
    container.appendChild(toast);

    const remove = () => {
      if (!toast.parentElement) return;
      toast.classList.add('fp-toast-out');
      setTimeout(() => toast.remove(), 340);
    };
    toast.querySelector('.toast-close').addEventListener('click', remove);
    setTimeout(remove, duration);
  },

  // Legacy alert (kept for compatibility)
  showAlert(message, type = 'success', duration = 4000) {
    const typeMap = { error: 'error', warning: 'warning', info: 'info' };
    this.toast(message, typeMap[type] || type, duration);
  },

  // Confirm dialog
  async showConfirm(message, title = 'Confirmar') {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'modal-backdrop-apple';
      modal.innerHTML = `
        <div class="modal-apple" style="max-width:400px;">
          <div class="modal-apple-body">
            <div class="confirm-dialog">
              <div class="confirm-icon" style="background:var(--warning-light);color:var(--warning);">
                <i class="bi bi-question-circle"></i>
              </div>
              <h4>${title}</h4>
              <p>${message}</p>
            </div>
          </div>
          <div class="modal-apple-footer" style="justify-content:center;">
            <button class="btn-apple btn-secondary confirm-cancel">Cancelar</button>
            <button class="btn-apple btn-primary confirm-ok">Confirmar</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      modal.querySelector('.confirm-cancel').onclick = () => { modal.remove(); resolve(false); };
      modal.querySelector('.confirm-ok').onclick = () => { modal.remove(); resolve(true); };
      modal.addEventListener('click', (e) => { if (e.target === modal) { modal.remove(); resolve(false); } });
    });
  },

  // Formatting
  formatNumber(n) {
    return new Intl.NumberFormat('es-PE').format(n);
  },

  formatDate(d) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' });
  },

  formatDateTime(d) {
    if (!d) return '-';
    return new Date(d).toLocaleString('es-PE');
  },

  // Form helpers
  getFormData(formId) {
    const form = document.getElementById(formId);
    if (!form) return {};
    const data = {};
    const elements = form.querySelectorAll('input, select, textarea');
    elements.forEach(el => {
      if (el.name) {
        if (el.type === 'checkbox') {
          data[el.name] = el.checked;
        } else if (el.type === 'number') {
          data[el.name] = el.value === '' ? null : parseInt(el.value, 10);
        } else {
          data[el.name] = el.value || null;
        }
      }
    });
    return data;
  },

  resetForm(formId) {
    const form = document.getElementById(formId);
    if (form) form.reset();
  },

  populateSelect(selectId, items, valueKey, labelKey, placeholder = 'Seleccionar...') {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = `<option value="">${placeholder}</option>`;
    items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item[valueKey];
      opt.textContent = item[labelKey];
      select.appendChild(opt);
    });
  },

  setSelectValue(selectId, value) {
    const select = document.getElementById(selectId);
    if (select) select.value = value || '';
  },

  // Download blob as file
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Dynamic CSS theme application
  applyTheme(prefs) {
    if (!prefs) return;
    const root = document.documentElement;
    if (prefs.primary_color) root.style.setProperty('--primary', prefs.primary_color);
    if (prefs.secondary_color) root.style.setProperty('--secondary', prefs.secondary_color);
    if (prefs.background_color) root.style.setProperty('--bg', prefs.background_color);
    if (prefs.card_color) root.style.setProperty('--card', prefs.card_color);
    if (prefs.text_color) root.style.setProperty('--text', prefs.text_color);
    document.documentElement.setAttribute('data-theme', prefs.theme_mode || 'light');
    document.documentElement.setAttribute('data-density', prefs.density || 'normal');
  },

  // Debounce
  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  // Convert base64 string to Blob
  base64ToBlob(base64, mimeType = 'application/octet-stream') {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  },

  // Bootstrap confirm modal - returns Promise<boolean>
  confirm(title, message) {
    return new Promise(resolve => {
      let modal = document.getElementById('utilsConfirmModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'utilsConfirmModal';
        modal.className = 'modal fade';
        modal.tabIndex = -1;
        modal.innerHTML = `
          <div class="modal-dialog modal-sm modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-body text-center py-4">
                <div class="mb-3" style="font-size:48px;color:var(--danger);"><i class="bi bi-exclamation-triangle-fill"></i></div>
                <h5 id="utilsConfirmTitle"></h5>
                <p class="text-muted mb-0" id="utilsConfirmMsg"></p>
              </div>
              <div class="modal-footer justify-content-center border-0 pt-0">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-danger" id="utilsConfirmBtn">Eliminar</button>
              </div>
            </div>
          </div>`;
        document.body.appendChild(modal);
      }
      document.getElementById('utilsConfirmTitle').textContent = title;
      document.getElementById('utilsConfirmMsg').textContent = message;
      const bsModal = new bootstrap.Modal(modal);
      const btn = document.getElementById('utilsConfirmBtn');
      const handler = () => { bsModal.hide(); resolve(true); };
      btn.replaceWith(btn.cloneNode(true));
      document.getElementById('utilsConfirmBtn').addEventListener('click', handler);
      modal.addEventListener('hidden.bs.modal', () => resolve(false), { once: true });
      bsModal.show();
    });
  }
};

/* Exponer para otros módulos y vistas (SPA) */
window.Utils = Utils;
