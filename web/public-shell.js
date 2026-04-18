import { hasServerSession, logOut, bindThemeToggles, isSingleUserSession } from './auth.js';

const session = await hasServerSession();
const sessionArea = document.getElementById('sessionArea');

if (sessionArea) {
  const health = await fetch('/api/health').then((response) => response.json()).catch(() => null);
  const healthLabel = health?.status === 'ok' ? 'System online' : 'System check';
  const isLanding = window.location.pathname.endsWith('/index.html') || window.location.pathname === '/' || window.location.pathname === '';

  if (session?.email) {
    const singleUser = isSingleUserSession(session);
    const logoutHtml = singleUser
      ? ''
      : '<button id="publicLogoutBtn" type="button">Log out</button>';

    sessionArea.innerHTML = isLanding
      ? `
        <div class="session-chip">
          <span class="status-dot"></span>
          <a class="button-link secondary" href="./dashboard.html">Workspace</a>
          <button class="button-link secondary" type="button" data-theme-toggle>Light mode</button>
          ${logoutHtml}
        </div>
      `
      : `
        <div class="session-chip">
          <span class="status-dot"></span>
          <span>${healthLabel}</span>
          <button class="button-link secondary" type="button" data-theme-toggle>Light mode</button>
          <a class="button-link secondary" href="./dashboard.html">Workspace</a>
          ${logoutHtml}
        </div>
      `;

    bindThemeToggles(sessionArea);

    document.getElementById('publicLogoutBtn')?.addEventListener('click', async () => {
      await logOut();
      window.location.href = './index.html';
    });
  } else {
    sessionArea.innerHTML = isLanding
      ? `<div class="session-chip"><button class="button-link secondary" type="button" data-theme-toggle>Light mode</button><a class="button-link secondary" href="./dashboard.html">Open workspace</a></div>`
      : `<div class="session-chip"><span class="status-dot"></span><span>${healthLabel}</span><button class="button-link secondary" type="button" data-theme-toggle>Light mode</button><a class="button-link secondary" href="./dashboard.html">Open workspace</a></div>`;
    bindThemeToggles(sessionArea);
  }
}

if (session?.email) {
  document.querySelectorAll('[data-auth-dashboard]').forEach((element) => {
    element.setAttribute('href', './dashboard.html');
  });
}
