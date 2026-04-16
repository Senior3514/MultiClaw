import { hasServerSession, logOut } from './auth.js';

const session = await hasServerSession();
const sessionArea = document.getElementById('sessionArea');

if (sessionArea) {
  if (session?.email) {
    sessionArea.innerHTML = `
      <div class="session-chip">
        <span>${session.email}</span>
        <a class="button-link secondary" href="./dashboard.html">Dashboard</a>
        <button id="publicLogoutBtn" type="button">Log out</button>
      </div>
    `;

    document.getElementById('publicLogoutBtn')?.addEventListener('click', async () => {
      await logOut();
      window.location.href = './index.html';
    });
  } else {
    sessionArea.innerHTML = '<a class="button-link secondary" href="./login.html">Log in</a>';
  }
}

if (session?.email) {
  document.querySelectorAll('[data-auth-dashboard]').forEach((element) => {
    element.setAttribute('href', './dashboard.html');
  });
}
