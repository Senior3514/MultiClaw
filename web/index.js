import { hasServerSession, mountThemeToggleOnly, toggleSecretMode } from './auth.js';

const tryGeneratorBtn = document.getElementById('tryGeneratorBtn');
const openWorkspaceBtn = document.getElementById('openWorkspaceBtn');
const homeInstallCommandEl = document.getElementById('homeInstallCommand');
const copyHomeInstallButton = document.getElementById('copyHomeInstallCommand');
const homePlatformNoteEl = document.getElementById('homePlatformNote');
const landingFinalCommandEl = document.getElementById('landingFinalCommand');
const copyLandingFinalCommandButton = document.getElementById('copyLandingFinalCommand');
const landingHeroGraphic = document.getElementById('landingHeroGraphic');

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
    ? 'wsl bash -lc "curl -fsSL https://raw.githubusercontent.com/Senior3514/MultiClaw/main/scripts/bootstrap.sh | bash"'
    : 'curl -fsSL https://raw.githubusercontent.com/Senior3514/MultiClaw/main/scripts/bootstrap.sh | bash';
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
      toggleSecretMode();
      landingHeroGraphic?.classList.add('hero-burst');
      window.setTimeout(() => landingHeroGraphic?.classList.remove('hero-burst'), 900);
      secretToggleCount = 0;
      clearTimeout(secretToggleTimer);
    }
  });
});

function bindHeroAtmosphere() {
  if (!landingHeroGraphic) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const resetHeroAtmosphere = () => {
    landingHeroGraphic.style.setProperty('--hero-tilt-x', '0deg');
    landingHeroGraphic.style.setProperty('--hero-tilt-y', '0deg');
    landingHeroGraphic.style.setProperty('--hero-drift-x', '0px');
    landingHeroGraphic.style.setProperty('--hero-drift-y', '0px');
    landingHeroGraphic.style.setProperty('--hero-drift-soft-x', '0px');
    landingHeroGraphic.style.setProperty('--hero-drift-soft-y', '0px');
    landingHeroGraphic.style.setProperty('--hero-glow-x', '50%');
    landingHeroGraphic.style.setProperty('--hero-glow-y', '50%');
  };

  landingHeroGraphic.addEventListener('pointermove', (event) => {
    const rect = landingHeroGraphic.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) - 0.5;
    const y = ((event.clientY - rect.top) / rect.height) - 0.5;
    landingHeroGraphic.style.setProperty('--hero-tilt-x', `${(-y * 7).toFixed(2)}deg`);
    landingHeroGraphic.style.setProperty('--hero-tilt-y', `${(x * 8).toFixed(2)}deg`);
    landingHeroGraphic.style.setProperty('--hero-drift-x', `${(x * 18).toFixed(1)}px`);
    landingHeroGraphic.style.setProperty('--hero-drift-y', `${(y * 16).toFixed(1)}px`);
    landingHeroGraphic.style.setProperty('--hero-drift-soft-x', `${(x * 10).toFixed(1)}px`);
    landingHeroGraphic.style.setProperty('--hero-drift-soft-y', `${(y * 9).toFixed(1)}px`);
    landingHeroGraphic.style.setProperty('--hero-glow-x', `${(50 + (x * 14)).toFixed(1)}%`);
    landingHeroGraphic.style.setProperty('--hero-glow-y', `${(48 + (y * 12)).toFixed(1)}%`);
  });

  landingHeroGraphic.addEventListener('pointerleave', resetHeroAtmosphere);
  resetHeroAtmosphere();
}

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
bindHeroAtmosphere();

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
