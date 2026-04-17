const SESSION_KEY = 'multiclaw-session';
const THEME_KEY = 'multiclaw-theme';

function getStoredTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function applyTheme(theme = getStoredTheme()) {
  document.body?.classList.toggle('light-theme', theme === 'light');
  localStorage.setItem(THEME_KEY, theme);
  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.textContent = theme === 'light' ? 'Dark mode' : 'Light mode';
  });
}

export function toggleTheme() {
  applyTheme(document.body?.classList.contains('light-theme') ? 'dark' : 'light');
}

export function bindThemeToggles(scope = document) {
  scope.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.onclick = () => toggleTheme();
  });
  applyTheme();
}

export function mountThemeToggleOnly() {
  const sessionArea = document.getElementById('sessionArea');
  if (!sessionArea || sessionArea.children.length) return;
  sessionArea.innerHTML = '<div class="session-chip"><button class="button-link secondary" type="button" data-theme-toggle>Light mode</button></div>';
  bindThemeToggles(sessionArea);
}

applyTheme();

function setLocalSession(email) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email, signedInAt: new Date().toISOString() }));
}

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function logOut() {
  try {
    await request('/api/auth/logout', {});
  } catch {
    // no-op
  }
  clearSession();
}

function setStatus(message, kind = 'idle') {
  const status = document.getElementById('authStatus');
  if (!status) return;
  status.textContent = message;
  status.className = `status-banner status-${kind}`;
}

async function request(path, payload = null) {
  const response = await fetch(path, {
    method: payload ? 'POST' : 'GET',
    headers: payload ? { 'Content-Type': 'application/json' } : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
    credentials: 'same-origin',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }
  return data;
}

async function signUp(email, password, confirmPassword) {
  if (!email || !password) throw new Error('Email and password are required.');
  if (password.length < 8) throw new Error('Password must be at least 8 characters.');
  if (password !== confirmPassword) throw new Error('Passwords do not match.');

  const data = await request('/api/auth/signup', { email, password });
  setLocalSession(data.email);
}

async function logIn(email, password) {
  if (!email || !password) throw new Error('Email and password are required.');
  const data = await request('/api/auth/login', { email, password });
  setLocalSession(data.email);
}

export async function requireAuth() {
  document.body?.classList.add('auth-pending');
  const session = getSession();
  if (!session?.email) {
    window.location.href = './login.html';
    throw new Error('Authentication required');
  }

  try {
    const serverSession = await request('/api/auth/me');
    setLocalSession(serverSession.email);
    document.body?.classList.remove('auth-pending');
    return serverSession;
  } catch {
    clearSession();
    window.location.href = './login.html';
    throw new Error('Authentication required');
  }
}

export async function hasServerSession() {
  try {
    const serverSession = await request('/api/auth/me');
    setLocalSession(serverSession.email);
    return serverSession;
  } catch {
    clearSession();
    return null;
  }
}

export function mountSession() {
  const sessionArea = document.getElementById('sessionArea');
  if (!sessionArea) return;

  const session = getSession();
  if (!session?.email) {
    sessionArea.innerHTML = '<div class="session-chip"><button class="button-link secondary" type="button" data-theme-toggle>Light mode</button><a class="button-link secondary" href="./dashboard.html">Open workspace</a></div>';
    bindThemeToggles(sessionArea);
    return;
  }

  sessionArea.innerHTML = `
    <div class="session-chip">
      <span class="status-dot"></span>
      <span>${session.email}</span>
      <button class="button-link secondary" type="button" data-theme-toggle>Light mode</button>
      <button id="logoutBtn" type="button">Log out</button>
    </div>
  `;

  bindThemeToggles(sessionArea);

  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await logOut();
    window.location.href = './login.html';
  });
}

export async function initAuthPage(mode) {
  const existing = await hasServerSession();
  if (existing?.email) {
    window.location.href = './dashboard.html';
    return;
  }

  const actionButton = document.getElementById('authAction');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirmPassword');

  actionButton.addEventListener('click', async () => {
    const original = actionButton.textContent;
    actionButton.disabled = true;
    actionButton.textContent = mode === 'signup' ? 'Creating...' : 'Logging in...';

    try {
      if (mode === 'signup') {
        await signUp(emailInput.value.trim().toLowerCase(), passwordInput.value, confirmInput.value);
        setStatus('Account created successfully. Redirecting to the dashboard...', 'success');
      } else {
        await logIn(emailInput.value.trim().toLowerCase(), passwordInput.value);
        setStatus('Logged in successfully. Redirecting to the dashboard...', 'success');
      }

      setTimeout(() => {
        window.location.href = './dashboard.html';
      }, 600);
    } catch (error) {
      console.error(error);
      setStatus(error.message || 'Authentication failed.', 'error');
    } finally {
      actionButton.disabled = false;
      actionButton.textContent = original;
    }
  });
}
