import { authApi } from '../api/authApi.js';
import { setAuth } from '../utils/authGuard.js';
import { showToast } from '../utils/notifications.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('register-form');
  const fullNameInput = document.getElementById('fullName');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const collegeInput = document.getElementById('college');
  const degreeSelect = document.getElementById('degree');
  const branchInput = document.getElementById('branch');
  const graduationYearInput = document.getElementById('graduationYear');
  const togglePassBtn = document.getElementById('toggle-password');
  const errorAlert = document.getElementById('error-alert');
  const submitBtn = document.getElementById('submit-btn');

  togglePassBtn.addEventListener('click', () => {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    togglePassBtn.innerHTML = isPassword ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorAlert.classList.add('d-none');
    errorAlert.textContent = '';

    const payload = {
      fullName: fullNameInput.value.trim(),
      email: emailInput.value.trim(),
      password: passwordInput.value,
      college: collegeInput.value.trim() || null,
      degree: degreeSelect.value || null,
      branch: branchInput.value.trim() || null,
      graduationYear: graduationYearInput.value ? parseInt(graduationYearInput.value) : null
    };

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span> Creating Profile...';

    try {
      const response = await authApi.register(payload);
      setAuth(response.token, {
        id: response.id,
        email: response.email,
        fullName: response.fullName,
        role: response.role
      });

      showToast('Registration successful! Redirecting to dashboard...', 'success');
      setTimeout(() => {
        window.location.href = '/pages/dashboard.html';
      }, 800);
    } catch (err) {
      errorAlert.textContent = err.message || 'Registration failed. Please check inputs.';
      errorAlert.classList.remove('d-none');
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Create Account</span> <i class="bi bi-arrow-right"></i>';
    }
  });
});
