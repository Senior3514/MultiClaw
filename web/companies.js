import { mountSession, requireAuth } from './auth.js';

await requireAuth();
mountSession();

const statusEl = document.getElementById('companiesStatus');
const gridEl = document.getElementById('companiesGrid');
const searchEl = document.getElementById('companiesSearch');
const productOriginEl = document.getElementById('companiesProductOrigin');
const autonomyModeEl = document.getElementById('companiesAutonomyMode');
let allCompanies = [];

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function setStatus(message, kind = 'idle') {
  statusEl.textContent = message;
  statusEl.className = `status-banner status-${kind}`;
}

function renderCompanyCard(company) {
  const execution = company.executionState || {};

  return `
    <article class="panel feature-card company-card">
      <div class="eyebrow">${escapeHtml(company.companyId)}</div>
      <h2>${escapeHtml(company.projectName)}</h2>
      <p>${escapeHtml(company.description)}</p>
      <div class="company-meta">
        <span>${escapeHtml(company.archetype)}</span>
        <span>${escapeHtml(company.stage)}</span>
        <span>${escapeHtml(company.productOrigin || 'Existing product')}</span>
        <span>${escapeHtml(company.autonomyMode || 'Operator-assisted')}</span>
        <span>${escapeHtml(company.rolesCount)} leads</span>
      </div>
      <div class="route-card">
        <small>${escapeHtml(execution.status || 'unknown')}</small>
        <strong>${escapeHtml(execution.focus || 'Awaiting visible focus')}</strong>
        <p>${escapeHtml(execution.summary || 'Execution summary not available yet.')}</p>
      </div>
      <div class="company-footer">
        <small>Generated: ${escapeHtml(company.generatedAt)}</small>
        <small>Last activity: ${escapeHtml(execution.lastActivityAt || 'n/a')}</small>
      </div>
      <div class="cta-row">
        <a class="button-link secondary" href="./company.html?id=${encodeURIComponent(company.companyId)}">Open company</a>
      </div>
    </article>
  `;
}

function applyFilters() {
  const query = (searchEl.value || '').trim().toLowerCase();
  const productOrigin = productOriginEl.value;
  const autonomyMode = autonomyModeEl.value;

  const filtered = allCompanies.filter((company) => {
    const haystack = [company.projectName, company.description, company.companyId]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const matchesQuery = !query || haystack.includes(query);
    const matchesOrigin = !productOrigin || (company.productOrigin || 'Existing product') === productOrigin;
    const matchesAutonomy = !autonomyMode || (company.autonomyMode || 'Operator-assisted') === autonomyMode;
    return matchesQuery && matchesOrigin && matchesAutonomy;
  });

  if (!allCompanies.length) {
    setStatus('No generated companies yet. Use the generator to create the first one.', 'idle');
    gridEl.innerHTML = '';
    return;
  }

  if (!filtered.length) {
    setStatus('No companies matched the current filters.', 'idle');
    gridEl.innerHTML = '';
    return;
  }

  setStatus(`Showing ${filtered.length} of ${allCompanies.length} compan${filtered.length === 1 ? 'y' : 'ies'}.`, 'success');
  gridEl.innerHTML = filtered.map(renderCompanyCard).join('');
}

async function loadCompanies() {
  try {
    const response = await fetch('/api/companies');
    if (!response.ok) throw new Error(`Failed with status ${response.status}`);
    const companies = await response.json();
    allCompanies = companies;
    applyFilters();
  } catch (error) {
    console.error(error);
    setStatus('Failed to load generated companies.', 'error');
  }
}

searchEl.addEventListener('input', applyFilters);
productOriginEl.addEventListener('change', applyFilters);
autonomyModeEl.addEventListener('change', applyFilters);

loadCompanies();
