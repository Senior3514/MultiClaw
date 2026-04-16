import { getSession, mountSession, requireAuth } from './auth.js';

requireAuth();
mountSession();

const titleEl = document.getElementById('dashboardTitle');
const recentCompaniesEl = document.getElementById('recentCompanies');
const session = getSession();

if (session?.email) {
  titleEl.textContent = `Welcome back, ${session.email}`;
}

function renderCompany(company) {
  return `
    <div class="route-card">
      <small>${company.generatedAt}</small>
      <strong>${company.projectName}</strong>
      <p>${company.archetype}</p>
      <div class="cta-row">
        <a class="button-link secondary" href="./company.html?id=${encodeURIComponent(company.companyId)}">Open company</a>
      </div>
    </div>
  `;
}

async function loadRecentCompanies() {
  try {
    const response = await fetch('/api/companies');
    if (!response.ok) throw new Error(`Failed with status ${response.status}`);
    const companies = await response.json();

    if (!companies.length) {
      recentCompaniesEl.innerHTML = '<div class="route-card"><strong>No companies yet</strong><p>Generate the first one from the generator.</p></div>';
      return;
    }

    recentCompaniesEl.innerHTML = companies.slice(0, 3).map(renderCompany).join('');
  } catch (error) {
    console.error(error);
    recentCompaniesEl.innerHTML = '<div class="route-card"><strong>Failed to load companies</strong><p>Try again shortly.</p></div>';
  }
}

loadRecentCompanies();
