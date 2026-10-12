export function getToken() {
  return localStorage.getItem('token');
}

export function getUser() {
  const userStr = localStorage.getItem('user');
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
}

export function setAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function requireAuth() {
  const token = getToken();
  if (!token) {
    window.location.href = '/pages/login.html';
    return false;
  }
  return true;
}

export function requireAdmin() {
  if (!requireAuth()) return false;
  const user = getUser();
  if (!user || user.role !== 'ROLE_ADMIN') {
    alert('Access restricted: Placement Officer / Admin account required.');
    window.location.href = '/pages/dashboard.html';
    return false;
  }
  return true;
}

export function setupNavigation(activeKey) {
  const user = getUser();
  if (user) {
    const userNames = document.querySelectorAll('.current-user-name');
    userNames.forEach(el => el.textContent = user.fullName || user.email);

    const userEmails = document.querySelectorAll('.current-user-email');
    userEmails.forEach(el => el.textContent = user.email);

    const userInitials = document.querySelectorAll('.current-user-initials');
    const initials = (user.fullName || user.email || 'U').substring(0, 2).toUpperCase();
    userInitials.forEach(el => el.textContent = initials);

    const adminBadges = document.querySelectorAll('.admin-only-link');
    adminBadges.forEach(el => {
      if (user.role === 'ROLE_ADMIN') {
        el.classList.remove('d-none');
      } else {
        el.classList.add('d-none');
      }
    });
  }

  // Highlight active link
  if (activeKey) {
    const activeLink = document.querySelector(`[data-nav="${activeKey}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }
  }

  // Logout handlers
  const logoutButtons = document.querySelectorAll('.btn-logout');
  logoutButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      clearAuth();
      window.location.href = '/pages/login.html';
    });
  });

  // Mobile sidebar toggler
  const sidebarToggler = document.getElementById('sidebar-toggler');
  const sidebar = document.querySelector('.dashboard-sidebar');
  const backdrop = document.querySelector('.sidebar-backdrop');

  if (sidebarToggler && sidebar) {
    sidebarToggler.addEventListener('click', () => {
      sidebar.classList.toggle('show');
      if (backdrop) backdrop.classList.toggle('show');
    });
  }

  if (backdrop && sidebar) {
    backdrop.addEventListener('click', () => {
      sidebar.classList.remove('show');
      backdrop.classList.remove('show');
    });
  }
}
