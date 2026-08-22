// Auth Module
const Auth = {
  isLoggedIn() {
    return !!localStorage.getItem('token');
  },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/html/login.html';
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
      window.location.href = '/html/dashboard.html';
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
