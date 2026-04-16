import { mountSession, requireAuth } from './auth.js';

await requireAuth();
mountSession();

const SETTINGS_KEY = 'multiclaw-settings';
const statusEl = document.getElementById('settingsStatus');
const productOriginEl = document.getElementById('defaultProductOrigin');
const autonomyModeEl = document.getElementById('defaultAutonomyMode');
const saveBtn = document.getElementById('saveSettingsBtn');

function setStatus(message, kind = 'idle') {
  statusEl.textContent = message;
  statusEl.className = `status-banner status-${kind}`;
}

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

const current = loadSettings();
if (current.defaultProductOrigin) productOriginEl.value = current.defaultProductOrigin;
if (current.defaultAutonomyMode) autonomyModeEl.value = current.defaultAutonomyMode;

saveBtn.addEventListener('click', () => {
  saveSettings({
    defaultProductOrigin: productOriginEl.value,
    defaultAutonomyMode: autonomyModeEl.value,
  });
  setStatus('Workspace defaults saved successfully.', 'success');
});
