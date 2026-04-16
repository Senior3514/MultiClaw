#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const command = argv[0] || 'help';
const isDemo = argv.includes('--demo');
const cwd = process.cwd();
const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const runtimeDir = path.join(cwd, '.multiclaw');
const runtimeConfigPath = path.join(runtimeDir, 'config.json');
const pidPath = path.join(repoRoot, 'ops', 'multiclaw-web.pid');
const statePath = path.join(repoRoot, 'ops', 'multiclaw-web.state.json');

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'multiclaw-project';
}

function inferArchetype({ businessModel, description }) {
  const text = `${businessModel} ${description}`.toLowerCase();
  if (text.includes('marketplace')) return 'marketplace';
  if (text.includes('ecommerce') || text.includes('e-commerce') || text.includes('shop')) return 'e-commerce';
  if (text.includes('content') || text.includes('media') || text.includes('newsletter')) return 'content/media';
  if (text.includes('lead') || text.includes('agency')) return 'lead-generation';
  if (text.includes('internal') || text.includes('ops') || text.includes('operations') || text.includes('vps')) return 'internal-ops';
  return 'saas-product';
}

function buildRoles(archetype) {
  const base = [
    { key: 'operator', title: 'Operator', scope: 'Runs the whole company rhythm, priorities, coordination, and delivery.' },
    { key: 'cto', title: 'CTO / Systems Lead', scope: 'Owns architecture, tooling, runtime choices, and technical integrity.' },
    { key: 'product', title: 'Product Lead', scope: 'Turns goals into roadmap, specs, and product decisions.' },
    { key: 'growth', title: 'Growth Lead', scope: 'Owns acquisition, activation, messaging, and conversion loops.' },
    { key: 'qa', title: 'QA / Reliability Lead', scope: 'Owns quality, testing, stability, and release confidence.' },
  ];

  const optional = {
    'marketplace': [
      { key: 'supply', title: 'Supply Operations Lead', scope: 'Owns marketplace-side inventory, onboarding, and quality.' },
      { key: 'demand', title: 'Demand Operations Lead', scope: 'Owns buyer-side growth, matching, and funnel performance.' },
    ],
    'e-commerce': [
      { key: 'catalog', title: 'Catalog Operations Lead', scope: 'Owns product catalog quality, pricing presentation, and merchandising flow.' },
      { key: 'retention', title: 'Retention Lead', scope: 'Owns repeat purchase, lifecycle messaging, and LTV growth.' },
    ],
    'content/media': [
      { key: 'content', title: 'Content Lead', scope: 'Owns publishing cadence, asset quality, and editorial execution.' },
      { key: 'audience', title: 'Audience Lead', scope: 'Owns reach, engagement, and community growth.' },
    ],
    'lead-generation': [
      { key: 'salesops', title: 'Sales Ops Lead', scope: 'Owns intake, qualification, routing, and booked meetings.' },
      { key: 'retention', title: 'Follow-up Lead', scope: 'Owns lead recovery, reminders, and close support.' },
    ],
    'internal-ops': [
      { key: 'automation', title: 'Automation Lead', scope: 'Owns process automation, runbooks, and efficiency systems.' },
      { key: 'support', title: 'Support Lead', scope: 'Owns internal adoption, request handling, and operational feedback.' },
    ],
    'saas-product': [
      { key: 'support', title: 'Support Lead', scope: 'Owns user issues, support patterns, and feedback loops.' },
      { key: 'research', title: 'Research Lead', scope: 'Owns market research, user insight, and strategic discovery.' },
    ],
  };

  return [...base, ...(optional[archetype] || [])];
}

function buildMission(data) {
  return [
    `1. Turn ${data.projectName} into a coherent operating company, not just a product.`,
    `2. Focus the first week on the top goals: ${data.topGoals}.`,
    '3. Create one visible delivery loop every day.',
    '4. Keep reporting compact, high-signal, and tied to outcomes.',
    '5. Protect speed without sacrificing structure or trust.',
  ];
}

function buildRoadmap(data, roles) {
  return {
    week1: [
      'Finalize brand, positioning, and project structure.',
      'Stand up the first working operating company files.',
      'Define ownership and output format for every lead role.',
      'Launch first internal coordination surface.',
    ],
    week2: [
      'Build or tighten the first product-critical workflow.',
      'Add monitoring, QA checkpoints, and recovery paths.',
      'Start metrics tracking around the primary business loop.',
    ],
    week3: [
      'Refine growth, onboarding, and activation surfaces.',
      'Remove friction, duplication, and weak ownership.',
      `Deepen role specialization across ${roles.length} core leads.`,
    ],
    week4: [
      'Package the operating model into reusable templates.',
      'Document what should become productized or automated next.',
      'Prepare the next 30-day plan based on live learning.',
    ],
  };
}

function buildBrand(data) {
  return {
    oneLiner: `${data.projectName} is ${data.description}`,
    promise: `MultiClaw gives ${data.projectName} a full AI company behind the scenes.`,
    traits: ['sharp', 'operational', 'clear', 'coordinated', 'trustworthy'],
  };
}

function buildCharter(data) {
  return [
    'Act, then report when safe.',
    'Keep coordination tight and outputs compact.',
    'Protect user trust, data boundaries, and project isolation.',
    'Prefer useful execution over ornamental complexity.',
    `Optimize for the current stage: ${data.stage}.`,
  ];
}

async function mkdirp(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function writeFile(filePath, content) {
  await mkdirp(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf8');
}

function renderReadme(data, roles, archetype) {
  return `# ${data.projectName}\n\nGenerated by MultiClaw.\n\n## Overview\n\n${data.projectName} is ${data.description}.\n\n- Target audience: ${data.audience}\n- Business model: ${data.businessModel}\n- Stage: ${data.stage}\n- Archetype: ${archetype}\n- Channels: ${data.channels}\n- Tone: ${data.tone}\n\n## Top goals\n\n${data.topGoals.split(',').map((goal) => `- ${goal.trim()}`).join('\n')}\n\n## Generated company\n\nThis company was generated to operate ${data.projectName} with a focused AI leadership structure and clear ownership.\n\n## Core roles\n\n${roles.map((role) => `- **${role.title}**: ${role.scope}`).join('\n')}\n`;
}

function renderBrand(data, brand) {
  return `# Brand\n\n## Project\n${data.projectName}\n\n## One-line description\n${brand.oneLiner}\n\n## Promise\n${brand.promise}\n\n## Voice\n${data.tone}\n\n## Traits\n${brand.traits.map((trait) => `- ${trait}`).join('\n')}\n`;
}

function renderCompany(data, roles) {
  return `# Company\n\n## Mission\nBuild and operate ${data.projectName} as a coordinated AI company that pushes the product forward every day.\n\n## Leadership\n- Operator\n- CTO / Systems Lead\n\n## Departments\n${roles.map((role) => `- ${role.title}`).join('\n')}\n\n## Risk sensitivity\n${data.riskSensitivity}\n`;
}

function renderOrgChart(roles) {
  const leadership = roles.slice(0, 2);
  const rest = roles.slice(2);
  return `# Org Chart\n\n## Leadership\n${leadership.map((role) => `- ${role.title}`).join('\n')}\n\n## Core leads\n${rest.map((role) => `- ${role.title}`).join('\n')}\n`;
}

function renderCharterFile(items) {
  return `# Charter\n\n${items.map((item, index) => `${index + 1}. ${item}`).join('\n')}\n`;
}

function renderMissionFile(items) {
  return `# Mission 001\n\n${items.map((item) => `- ${item}`).join('\n')}\n`;
}

function renderRoadmapFile(roadmap) {
  return `# 30-Day Roadmap\n\n## Week 1\n${roadmap.week1.map((item) => `- ${item}`).join('\n')}\n\n## Week 2\n${roadmap.week2.map((item) => `- ${item}`).join('\n')}\n\n## Week 3\n${roadmap.week3.map((item) => `- ${item}`).join('\n')}\n\n## Week 4\n${roadmap.week4.map((item) => `- ${item}`).join('\n')}\n`;
}

function renderRoleFile(role, data) {
  return `# ${role.title}\n\n## Scope\n${role.scope}\n\n## Current project\n${data.projectName}\n\n## Operating rule\nKeep output compact, useful, and tied to outcomes.\n`;
}

function getArgValue(name, fallback = null) {
  const exact = argv.find((arg) => arg.startsWith(`${name}=`));
  if (exact) return exact.slice(name.length + 1);
  const index = argv.indexOf(name);
  if (index >= 0 && argv[index + 1]) return argv[index + 1];
  return fallback;
}

function defaultRuntimeConfig() {
  return {
    bind: 'tailscale',
    port: 8813,
  };
}

async function loadRuntimeConfig() {
  try {
    const raw = await fs.readFile(runtimeConfigPath, 'utf8');
    return { ...defaultRuntimeConfig(), ...JSON.parse(raw) };
  } catch {
    return defaultRuntimeConfig();
  }
}

async function saveRuntimeConfig(config) {
  await mkdirp(runtimeDir);
  await fs.writeFile(runtimeConfigPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}

async function collectInput() {
  if (isDemo) {
    return {
      projectName: 'PulseBoard',
      description: 'a premium AI operating layer for high-ticket service businesses',
      audience: 'high-ticket service businesses',
      businessModel: 'SaaS with optional services',
      stage: 'MVP',
      topGoals: 'ship MVP, prove value, close first users',
      tone: 'sharp, premium, operational',
      techStack: 'TypeScript, Node.js, OpenClaw, web dashboard',
      channels: 'web, Telegram, email',
      riskSensitivity: 'high',
    };
  }

  const rl = readline.createInterface({ input, output });
  const ask = async (label, fallback) => {
    const answer = await rl.question(`${label}${fallback ? ` [${fallback}]` : ''}: `);
    return answer.trim() || fallback;
  };

  try {
    return {
      projectName: await ask('Project name', 'My Project'),
      description: await ask('One-line description', 'an ambitious AI product'),
      audience: await ask('Target audience', 'builders'),
      businessModel: await ask('Business model', 'SaaS'),
      stage: await ask('Current stage', 'MVP'),
      topGoals: await ask('Top 3 goals (comma-separated)', 'ship, validate, grow'),
      tone: await ask('Preferred tone / culture', 'sharp, clean, operational'),
      techStack: await ask('Tech stack', 'TypeScript, Node.js'),
      channels: await ask('Channels in use', 'web'),
      riskSensitivity: await ask('Risk sensitivity', 'medium'),
    };
  } finally {
    rl.close();
  }
}

async function generateProject(data) {
  const archetype = inferArchetype(data);
  const roles = buildRoles(archetype);
  const brand = buildBrand(data);
  const charter = buildCharter(data);
  const mission = buildMission(data);
  const roadmap = buildRoadmap(data, roles);
  const slug = slugify(data.projectName);
  const outputDir = path.join(cwd, 'generated', slug);

  await mkdirp(outputDir);
  await mkdirp(path.join(outputDir, 'roles'));
  await mkdirp(path.join(outputDir, 'workspaces'));
  await mkdirp(path.join(outputDir, 'dashboards'));

  await writeFile(path.join(outputDir, 'brief.json'), JSON.stringify({ ...data, archetype }, null, 2));
  await writeFile(path.join(outputDir, 'README.md'), renderReadme(data, roles, archetype));
  await writeFile(path.join(outputDir, 'BRAND.md'), renderBrand(data, brand));
  await writeFile(path.join(outputDir, 'COMPANY.md'), renderCompany(data, roles));
  await writeFile(path.join(outputDir, 'ORG-CHART.md'), renderOrgChart(roles));
  await writeFile(path.join(outputDir, 'CHARTER.md'), renderCharterFile(charter));
  await writeFile(path.join(outputDir, 'MISSION-001.md'), renderMissionFile(mission));
  await writeFile(path.join(outputDir, 'ROADMAP-30.md'), renderRoadmapFile(roadmap));

  for (const role of roles) {
    await writeFile(path.join(outputDir, 'roles', `${role.key}.md`), renderRoleFile(role, data));
  }

  await writeFile(path.join(outputDir, 'workspaces', 'README.md'), '# Workspaces\n\nCreate one isolated workspace per generated lead role when activating this company.\n');
  await writeFile(path.join(outputDir, 'dashboards', 'README.md'), '# Dashboards\n\nDashboard stubs live here. Add status, priorities, and team visibility surfaces here.\n');

  return { outputDir, archetype, roles };
}

async function setupRuntime() {
  const existing = await loadRuntimeConfig();
  const modeFlag = argv.includes('--local') ? 'local' : argv.includes('--tailscale') ? 'tailscale' : null;
  const portFlag = Number(getArgValue('--port', existing.port)) || existing.port;

  if (modeFlag) {
    const config = { bind: modeFlag, port: portFlag };
    await saveRuntimeConfig(config);
    console.log(`MultiClaw runtime configured at ${runtimeConfigPath}`);
    console.log(JSON.stringify(config, null, 2));
    return;
  }

  const rl = readline.createInterface({ input, output });
  const ask = async (label, fallback) => {
    const answer = await rl.question(`${label}${fallback ? ` [${fallback}]` : ''}: `);
    return answer.trim() || fallback;
  };

  try {
    const bindAnswer = (await ask('Bind mode (tailscale/local)', existing.bind)).toLowerCase();
    const bind = bindAnswer === 'local' ? 'local' : 'tailscale';
    const port = Number(await ask('Port', String(existing.port))) || existing.port;
    const config = { bind, port };
    await saveRuntimeConfig(config);
    console.log(`MultiClaw runtime configured at ${runtimeConfigPath}`);
    console.log(JSON.stringify(config, null, 2));
  } finally {
    rl.close();
  }
}

function runScript(scriptName, args = []) {
  const result = spawnSync('bash', [path.join(repoRoot, 'ops', scriptName), ...args], {
    cwd: repoRoot,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exitCode = result.status || 1;
  }
}

function getTailscaleIp() {
  const result = spawnSync('tailscale', ['ip', '-4'], { encoding: 'utf8' });
  if (result.status !== 0) return null;
  return result.stdout.split(/\r?\n/).map((line) => line.trim()).find(Boolean) || null;
}

async function startRuntime(forceBind = null) {
  const config = await loadRuntimeConfig();
  const bind = forceBind || config.bind;
  const port = String(Number(getArgValue('--port', config.port)) || config.port);

  if (bind === 'local') {
    runScript('start_local.sh', [port]);
    return;
  }

  runScript('start_tailscale_only.sh', [port]);
}

async function printStatus() {
  const config = await loadRuntimeConfig();
  const running = await fs.readFile(pidPath, 'utf8').then((value) => value.trim()).catch(() => null);
  const state = await fs.readFile(statePath, 'utf8').then((value) => JSON.parse(value)).catch(() => null);
  const bind = config.bind;
  const host = state?.host || (bind === 'local' ? '127.0.0.1' : (getTailscaleIp() || 'tailscale-unavailable'));
  const port = state?.port || config.port;
  const url = state?.url || `http://${host}:${port}/`;

  console.log('MultiClaw runtime status');
  console.log(`- bind: ${bind}`);
  console.log(`- port: ${port}`);
  console.log(`- config: ${runtimeConfigPath}`);
  console.log(`- pid: ${running || 'not running'}`);
  console.log(`- url: ${url}`);
}

function printHelp() {
  console.log(`MultiClaw

Usage:
  multiclaw help
  multiclaw init
  multiclaw init --demo
  multiclaw setup [--tailscale|--local] [--port 8813]
  multiclaw start [--port 8813]
  multiclaw dev [--port 8813]
  multiclaw stop
  multiclaw status

Notes:
  - init generates a company package under ./generated/
  - setup creates a local runtime config under ./.multiclaw/config.json
  - start uses the configured bind mode (tailscale by default)
  - dev forces local bind on 127.0.0.1
`);
}

async function main() {
  if (command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  if (command === 'setup') {
    await setupRuntime();
    return;
  }

  if (command === 'start') {
    await startRuntime();
    return;
  }

  if (command === 'dev') {
    await startRuntime('local');
    return;
  }

  if (command === 'stop') {
    runScript('stop.sh');
    return;
  }

  if (command === 'status') {
    await printStatus();
    return;
  }

  if (command !== 'init') {
    printHelp();
    process.exitCode = 1;
    return;
  }

  const data = await collectInput();
  const result = await generateProject(data);

  console.log(`Generated company for ${data.projectName}`);
  console.log(`Path: ${result.outputDir}`);
  console.log(`Archetype: ${result.archetype}`);
  console.log(`Roles: ${result.roles.map((role) => role.title).join(', ')}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
