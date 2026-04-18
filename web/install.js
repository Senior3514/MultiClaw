const baseInstallCommandEl = document.getElementById('baseInstallCommand');
const advancedInstallCommandEl = document.getElementById('advancedInstallCommand');
const copyBaseButton = document.getElementById('copyBaseInstallCommand');
const copyAdvancedButton = document.getElementById('copyAdvancedInstallCommand');
const uninstallCommandEl = document.getElementById('uninstallCommand');
const copyUninstallButton = document.getElementById('copyUninstallCommand');
const quickStartCommandEl = document.getElementById('quickStartCommand');
const quickVerifyCommandEl = document.getElementById('quickVerifyCommand');
const quickStopCommandEl = document.getElementById('quickStopCommand');
const copyQuickStartButton = document.getElementById('copyQuickStartCommand');
const copyQuickVerifyButton = document.getElementById('copyQuickVerifyCommand');
const copyQuickStopButton = document.getElementById('copyQuickStopCommand');
const platformNoteEl = document.getElementById('platformNote');
const bindModeNoteEl = document.getElementById('bindModeNote');

const state = {
  platform: 'ubuntu',
  bind: 'tailscale',
  provider: 'openai',
  model: 'gpt-5.4',
  apiKeyEnv: 'OPENAI_API_KEY',
};

const platformNotes = {
  ubuntu: 'Ubuntu/VPS is the cleanest path right now.',
  macos: 'macOS follows the same one-command flow after git, node, npm, and python3 are installed.',
  windows: 'Windows should use WSL for the cleanest current runtime experience.',
};

const bindModeNotes = {
  local: 'Local mode is optimized toward a simpler single-user product flow on your own machine.',
  tailscale: 'Tailscale mode is optimized toward a protected workspace flow with cleaner private access.',
};

function renderCommand() {
  const bindFlag = state.bind === 'local' ? '--local' : '--tailscale';
  baseInstallCommandEl.textContent = 'cd ~ && curl -fsSL https://raw.githubusercontent.com/Senior3514/MultiClaw/main/scripts/bootstrap.sh | bash';
  if (advancedInstallCommandEl) {
    advancedInstallCommandEl.textContent = `Continue inside MultiClaw after install. Bind: ${state.bind}. Provider: ${state.provider}.`;
  }
  uninstallCommandEl.textContent = 'cd ~ && curl -fsSL https://raw.githubusercontent.com/Senior3514/MultiClaw/main/scripts/uninstall.sh | bash';
  if (quickStartCommandEl) quickStartCommandEl.textContent = 'multiclaw start';
  if (quickVerifyCommandEl) quickVerifyCommandEl.textContent = 'multiclaw verify';
  if (quickStopCommandEl) quickStopCommandEl.textContent = 'multiclaw stop';
  platformNoteEl.textContent = platformNotes[state.platform];
  bindModeNoteEl.textContent = bindModeNotes[state.bind];
}

function applyChoice(containerId, selector, onSelect) {
  document.querySelectorAll(`${containerId} ${selector}`).forEach((element) => {
    element.addEventListener('click', () => {
      document.querySelectorAll(`${containerId} ${selector}`).forEach((item) => item.classList.remove('selected'));
      element.classList.add('selected');
      onSelect(element);
      renderCommand();
    });
  });
}

applyChoice('#platformChoices', '.choice-card', (element) => {
  state.platform = element.dataset.platform;
});

applyChoice('#bindChoices', '.choice-card', (element) => {
  state.bind = element.dataset.bind;
});

applyChoice('#providerChoices', '.provider-card', (element) => {
  state.provider = element.dataset.provider;
  state.model = element.dataset.model;
  state.apiKeyEnv = element.dataset.keyEnv;
});

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

copyBaseButton.dataset.defaultLabel = 'Copy install';
if (copyAdvancedButton) copyAdvancedButton.dataset.defaultLabel = 'Copy advanced start';
copyUninstallButton.dataset.defaultLabel = 'Copy uninstall';
if (copyQuickStartButton) copyQuickStartButton.dataset.defaultLabel = 'Copy start';
if (copyQuickVerifyButton) copyQuickVerifyButton.dataset.defaultLabel = 'Copy verify';
if (copyQuickStopButton) copyQuickStopButton.dataset.defaultLabel = 'Copy stop';

copyBaseButton.addEventListener('click', async () => {
  await copyWithFeedback(copyBaseButton, baseInstallCommandEl.textContent, 'Copied');
});

if (copyAdvancedButton && advancedInstallCommandEl) {
  copyAdvancedButton.addEventListener('click', async () => {
    await copyWithFeedback(copyAdvancedButton, advancedInstallCommandEl.textContent, 'Copied');
  });
}

copyUninstallButton.addEventListener('click', async () => {
  await copyWithFeedback(copyUninstallButton, uninstallCommandEl.textContent, 'Copied');
});

if (copyQuickStartButton && quickStartCommandEl) {
  copyQuickStartButton.addEventListener('click', async () => {
    await copyWithFeedback(copyQuickStartButton, quickStartCommandEl.textContent, 'Copied');
  });
}

if (copyQuickVerifyButton && quickVerifyCommandEl) {
  copyQuickVerifyButton.addEventListener('click', async () => {
    await copyWithFeedback(copyQuickVerifyButton, quickVerifyCommandEl.textContent, 'Copied');
  });
}

if (copyQuickStopButton && quickStopCommandEl) {
  copyQuickStopButton.addEventListener('click', async () => {
    await copyWithFeedback(copyQuickStopButton, quickStopCommandEl.textContent, 'Copied');
  });
}

renderCommand();
