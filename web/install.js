const baseInstallCommandEl = document.getElementById('baseInstallCommand');
const advancedInstallCommandEl = document.getElementById('advancedInstallCommand');
const copyBaseButton = document.getElementById('copyBaseInstallCommand');
const copyAdvancedButton = document.getElementById('copyAdvancedInstallCommand');
const uninstallCommandEl = document.getElementById('uninstallCommand');
const copyUninstallButton = document.getElementById('copyUninstallCommand');
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
  baseInstallCommandEl.textContent = 'curl -fsSL https://raw.githubusercontent.com/Senior3514/MultiClaw/main/scripts/bootstrap.sh | bash';
  advancedInstallCommandEl.textContent = `multiclaw up ${bindFlag} --provider ${state.provider} --model ${state.model} --api-key-env ${state.apiKeyEnv} --api-key YOUR_KEY`;
  uninstallCommandEl.textContent = 'curl -fsSL https://raw.githubusercontent.com/Senior3514/MultiClaw/main/scripts/uninstall.sh | bash';
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
copyAdvancedButton.dataset.defaultLabel = 'Copy advanced start';
copyUninstallButton.dataset.defaultLabel = 'Copy uninstall';

copyBaseButton.addEventListener('click', async () => {
  await copyWithFeedback(copyBaseButton, baseInstallCommandEl.textContent, 'Copied');
});

copyAdvancedButton.addEventListener('click', async () => {
  await copyWithFeedback(copyAdvancedButton, advancedInstallCommandEl.textContent, 'Copied');
});

copyUninstallButton.addEventListener('click', async () => {
  await copyWithFeedback(copyUninstallButton, uninstallCommandEl.textContent, 'Copied');
});

renderCommand();
