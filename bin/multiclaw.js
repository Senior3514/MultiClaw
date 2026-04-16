#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const argv = process.argv.slice(2);
const command = argv[0] || 'help';
const isDemo = argv.includes('--demo');
const cwd = process.cwd();

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'multiclaw-project';
}

function title(value) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function inferArchetype({ businessModel, description }) {
  const text = `${businessModel} ${description}`.toLowerCase();
  if (text.includes('marketplace')) return 'marketplace';
  if (text.includes('ecommerce') || text.includes('e-commerce') || text.includes('shop')) return 'e-commerce';
  if (text.includes('content') || text.includes('media') || text.includes('newsletter')) return 'content/media';
  if (text.includes('lead') || text.includes('agency')) return 'lead-generation';
  if (text.includes('internal') || text.includes('ops') || text.includes('operations')) return 'internal-ops';
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
    `3. Create one visible delivery loop every day.`,
    `4. Keep reporting compact, high-signal, and tied to outcomes.`,
    `5. Protect speed without sacrificing structure or trust.`,
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

function printHelp() {
  console.log(`MultiClaw\n\nUsage:\n  multiclaw init\n  multiclaw init --demo\n`);
}

async function main() {
  if (command === 'help' || command === '--help' || command === '-h') {
    printHelp();
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
