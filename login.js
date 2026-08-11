import { registerUser, verifyLogin, setSession, getSession } from './store.js';

// Already logged in? go straight to dashboard.
if (getSession()) window.location.href = './dashboard.html';

const tabs = document.querySelectorAll('.auth-tab');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const errorBox = document.getElementById('auth-error');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    errorBox.style.display = 'none';
    if (tab.dataset.tab === 'login') { loginForm.style.display = 'block'; registerForm.style.display = 'none'; }
    else { loginForm.style.display = 'none'; registerForm.style.display = 'block'; }
  });
});

function showError(msg) { errorBox.textContent = msg; errorBox.style.display = 'block'; }

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.style.display = 'none';
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  const res = await verifyLogin(username, password);
  if (!res.ok) return showError(res.error);
  setSession(username.trim().toLowerCase());
  window.location.href = './dashboard.html';
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.style.display = 'none';
  const name = document.getElementById('reg-name').value;
  const username = document.getElementById('reg-username').value;
  const password = document.getElementById('reg-password').value;
  const res = await registerUser(username, password, name);
  if (!res.ok) return showError(res.error);
  setSession(username.trim().toLowerCase());
  window.location.href = './dashboard.html';
});
