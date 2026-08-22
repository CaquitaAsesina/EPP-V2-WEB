// Tables Module
const Tables = {
  render(tableId, columns, data, options = {}) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${columns.length}" class="text-center empty-state" style="padding:2rem;">
        <i class="bi bi-inbox" style="font-size:2rem;display:block;margin-bottom:0.5rem;opacity:0.3;"></i>
        No hay registros disponibles
      </td></tr>`;
      return;
    }

    tbody.innerHTML = data.map((row, idx) => {
      const cells = columns.map(col => {
        if (col.render) {
          return `<td>${col.render(row, idx)}</td>`;
        }
        const val = row[col.key];
        return `<td>${val !== null && val !== undefined ? val : '-'}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
  },

  renderPagination(containerId, { total, page, limit, totalPages }, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (totalPages <= 1) {
      container.innerHTML = `<span class="pagination-info">${total} registro(s)</span>`;
      return;
    }

    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);

    let pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    container.innerHTML = `
      <span class="pagination-info me-3">${start}-${end} de ${total}</span>
      <nav style="display:inline-block;">
        <ul class="pagination pagination-sm mb-0">
          <li class="page-item ${page <= 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${page - 1}">&laquo;</a>
          </li>
          ${pages.map(p => p === '...' ?
            `<li class="page-item disabled"><span class="page-link">...</span></li>` :
            `<li class="page-item ${p === page ? 'active' : ''}">
              <a class="page-link" href="#" data-page="${p}">${p}</a>
            </li>`
          ).join('')}
          <li class="page-item ${page >= totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${page + 1}">&raquo;</a>
          </li>
        </ul>
      </nav>
    `;

    container.querySelectorAll('.page-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const p = parseInt(link.dataset.page, 10);
        if (p >= 1 && p <= totalPages) onPageChange(p);
      });
    });
  }
};
