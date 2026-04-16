const installCommandEl = document.getElementById('installCommand');
const copyButton = document.getElementById('copyInstallCommand');
const platformNoteEl = document.getElementById('platformNote');

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

function renderCommand() {
  const bindFlag = state.bind === 'local' ? '--local' : '--tailscale';
  installCommandEl.textContent = `curl -fsSL https://raw.githubusercontent.com/Senior3514/MultiClaw/main/scripts/install.sh | bash -s -- ${bindFlag} --provider ${state.provider} --model ${state.model} --api-key-env ${state.apiKeyEnv} --api-key YOUR_KEY`;
  platformNoteEl.textContent = platformNotes[state.platform];
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

copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(installCommandEl.textContent);
    copyButton.textContent = 'Copied';
    setTimeout(() => {
      copyButton.textContent = 'Copy command';
    }, 1200);
  } catch {
    copyButton.textContent = 'Copy failed';
    setTimeout(() => {
      copyButton.textContent = 'Copy command';
    }, 1200);
  }
});

renderCommand();
