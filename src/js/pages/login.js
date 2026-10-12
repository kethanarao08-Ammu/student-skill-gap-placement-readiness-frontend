import { authApi } from '../api/authApi.js';
import { setAuth } from '../utils/authGuard.js';
import { showToast } from '../utils/notifications.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const togglePassBtn = document.getElementById('toggle-password');
  const errorAlert = document.getElementById('error-alert');
  const submitBtn = document.getElementById('submit-btn');

  // Toggle Password Visibility
  togglePassBtn.addEventListener('click', () => {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    togglePassBtn.innerHTML = isPassword ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
  });

  // Demo buttons
  document.getElementById('btn-fill-student').addEventListener('click', () => {
    emailInput.value = 'student@skillgap.edu';
    passwordInput.value = 'Student@123';
  });

  document.getElementById('btn-fill-admin').addEventListener('click', () => {
    emailInput.value = 'admin@skillgap.edu';
    passwordInput.value = 'Admin@123';
  });

  // Form Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorAlert.classList.add('d-none');
    errorAlert.textContent = '';

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      errorAlert.textContent = 'Please provide both email and password.';
      errorAlert.classList.remove('d-none');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span> Signing In...';

    try {
      const response = await authApi.login({ email, password });
      setAuth(response.token, {
        id: response.id,
        email: response.email,
        fullName: response.fullName,
        role: response.role
      });

      showToast(`Welcome back, ${response.fullName}!`, 'success');

      setTimeout(() => {
        if (response.role === 'ROLE_ADMIN') {
          window.location.href = '/pages/admin.html';
        } else {
          window.location.href = '/pages/dashboard.html';
        }
      }, 700);
    } catch (err) {
      errorAlert.textContent = err.message || 'Invalid credentials or server error.';
      errorAlert.classList.remove('d-none');
      showToast(err.message || 'Login failed', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Sign In</span> <i class="bi bi-arrow-right"></i>';
    }
  });
});
