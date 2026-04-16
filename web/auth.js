const USERS_KEY = 'multiclaw-users';
const SESSION_KEY = 'multiclaw-session';

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch {
    return [];
  }
}

function setUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function setSession(email) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email, signedInAt: new Date().toISOString() }));
}

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function setStatus(message, kind = 'idle') {
  const status = document.getElementById('authStatus');
  status.textContent = message;
  status.className = `status-banner status-${kind}`;
}

async function signUp(email, password, confirmPassword) {
  if (!email || !password) throw new Error('Email and password are required.');
  if (password.length < 8) throw new Error('Password must be at least 8 characters.');
  if (password !== confirmPassword) throw new Error('Passwords do not match.');

  const users = getUsers();
  if (users.some((user) => user.email === email)) throw new Error('Account already exists for this email.');

  const passwordHash = await hashPassword(password);
  users.push({ email, passwordHash, createdAt: new Date().toISOString() });
  setUsers(users);
  setSession(email);
}

async function logIn(email, password) {
  if (!email || !password) throw new Error('Email and password are required.');

  const users = getUsers();
  const passwordHash = await hashPassword(password);
  const user = users.find((entry) => entry.email === email && entry.passwordHash === passwordHash);
  if (!user) throw new Error('Invalid email or password.');

  setSession(email);
}

export function initAuthPage(mode) {
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
        setStatus('Account created successfully. Redirecting to the generator...', 'success');
      } else {
        await logIn(emailInput.value.trim().toLowerCase(), passwordInput.value);
        setStatus('Logged in successfully. Redirecting to the generator...', 'success');
      }

      setTimeout(() => {
        window.location.href = './generator.html';
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
