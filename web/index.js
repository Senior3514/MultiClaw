import { hasServerSession, mountThemeToggleOnly } from './auth.js';

const tryGeneratorBtn = document.getElementById('tryGeneratorBtn');
const openWorkspaceBtn = document.getElementById('openWorkspaceBtn');
const homeInstallCommandEl = document.getElementById('homeInstallCommand');
const copyHomeInstallButton = document.getElementById('copyHomeInstallCommand');
const homePlatformNoteEl = document.getElementById('homePlatformNote');
const landingFinalCommandEl = document.getElementById('landingFinalCommand');
const copyLandingFinalCommandButton = document.getElementById('copyLandingFinalCommand');

let secretToggleCount = 0;
let secretToggleTimer = null;

const homeInstallState = {
  platform: 'ubuntu',
};

const homePlatformNotes = {
  ubuntu: 'Ubuntu/VPS is the cleanest path right now.',
  macos: 'macOS follows the same one-command flow after git, node, npm, and python3 are installed.',
  windows: 'Windows should use WSL for the cleanest current runtime experience.',
};

function renderHomeInstallCommand() {
  if (!homeInstallCommandEl || !homePlatformNoteEl) return;
  homeInstallCommandEl.textContent = homeInstallState.platform === 'windows'
    ? 'wsl bash -lc "cd ~ && curl -fsSL https://raw.githubusercontent.com/Senior3514/MultiClaw/main/scripts/bootstrap.sh | bash"'
    : 'cd ~ && curl -fsSL https://raw.githubusercontent.com/Senior3514/MultiClaw/main/scripts/bootstrap.sh | bash';
  homePlatformNoteEl.textContent = homePlatformNotes[homeInstallState.platform];
}

async function copyWithFeedback(button, text, successText) {
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = successText;
    setTimeout(() => {
      button.textContent = button.dataset.defaultLabel;
    }, 1200);
  } catch {
    button.textContent = 'Copy failed';
    setTimeout(() => {
      button.textContent = button.dataset.defaultLabel;
    }, 1200);
  }
}

copyHomeInstallButton?.setAttribute('data-default-label', 'Copy install');
copyHomeInstallButton?.addEventListener('click', async () => {
  await copyWithFeedback(copyHomeInstallButton, homeInstallCommandEl.textContent, 'Copied');
});

copyLandingFinalCommandButton?.setAttribute('data-default-label', 'Copy install');
copyLandingFinalCommandButton?.addEventListener('click', async () => {
  await copyWithFeedback(copyLandingFinalCommandButton, landingFinalCommandEl.textContent, 'Copied');
});

document.querySelectorAll('[data-copy-text]').forEach((button) => {
  button.dataset.defaultLabel = 'Copy';
  button.addEventListener('click', async () => {
    await copyWithFeedback(button, button.dataset.copyText, 'Copied');
  });
});

document.querySelectorAll('[data-secret-toggle]').forEach((button) => {
  button.addEventListener('click', () => {
    secretToggleCount += 1;
    clearTimeout(secretToggleTimer);
    secretToggleTimer = setTimeout(() => {
      secretToggleCount = 0;
    }, 1200);

    if (secretToggleCount >= 3) {
      document.body.classList.toggle('secret-fire-mode');
      secretToggleCount = 0;
      clearTimeout(secretToggleTimer);
    }
  });
});

document.querySelectorAll('#homePlatformChoices .choice-card').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('#homePlatformChoices .choice-card').forEach((item) => item.classList.remove('selected'));
    button.classList.add('selected');
    homeInstallState.platform = button.dataset.platform;
    renderHomeInstallCommand();
  });
});

renderHomeInstallCommand();
mountThemeToggleOnly();

const session = await hasServerSession();

if (session?.email) {
  document.querySelectorAll('[data-auth-dashboard]').forEach((link) => {
    link.href = './dashboard.html';
  });
  if (tryGeneratorBtn) {
    tryGeneratorBtn.href = './generator.html';
    tryGeneratorBtn.textContent = 'Generator';
  }
  if (openWorkspaceBtn) {
    openWorkspaceBtn.href = './dashboard.html';
    openWorkspaceBtn.textContent = 'Workspace';
  }
} else {
  if (tryGeneratorBtn) {
    tryGeneratorBtn.href = './platform.html';
    tryGeneratorBtn.textContent = 'See platform';
  }
  if (openWorkspaceBtn) {
    openWorkspaceBtn.href = './install.html';
    openWorkspaceBtn.textContent = 'Install now';
  }
}
