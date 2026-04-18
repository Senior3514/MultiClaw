import { hasServerSession, logOut, bindThemeToggles } from './auth.js';

const session = await hasServerSession();
const sessionArea = document.getElementById('sessionArea');

if (sessionArea) {
  const health = await fetch('/api/health').then((response) => response.json()).catch(() => null);
  const healthLabel = health?.status === 'ok' ? 'System online' : 'System check';

  sessionArea.innerHTML = session?.email
    ? `
      <div class="session-chip">
        <span class="status-dot"></span>
        <span>${healthLabel}</span>
        <button class="button-link secondary" type="button" data-theme-toggle>Light mode</button>
        <a class="button-link secondary" href="./dashboard.html">Workspace</a>
        <button id="publicLogoutBtn" type="button">Log out</button>
      </div>
    `
    : `
      <div class="session-chip">
        <span class="status-dot"></span>
        <span>${healthLabel}</span>
        <button class="button-link secondary" type="button" data-theme-toggle>Light mode</button>
        <a class="button-link secondary" href="./dashboard.html">Workspace</a>
        <a class="button-link secondary" href="./login.html">Sign in</a>
      </div>
    `;

  bindThemeToggles(sessionArea);

  document.getElementById('publicLogoutBtn')?.addEventListener('click', async () => {
    await logOut();
    window.location.href = './index.html';
  });
}

if (session?.email) {
  document.querySelectorAll('[data-auth-dashboard]').forEach((element) => {
    element.setAttribute('href', './dashboard.html');
  });
}
