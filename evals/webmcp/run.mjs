// Runs the WebMCP scenarios: checks each scenario's premises with the tools,
// then has agents answer it with only GCV's tools, judges each answer
// against the scenario's rubric, and checks the view the agent ends on with
// the scenario's outcome checks. See README.md.
//
//   node evals/webmcp/run.mjs [--base URL] [--scenario ID] [--runs N]
//     [--model MODEL] [--judge-model MODEL] [--premises-only]
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright';
import { scenarios } from './scenarios.mjs';

const PLAYWRIGHT_MCP = '@playwright/mcp@0.0.83';
// Chrome's WebMCP is behind these flags
const CHROME = {
  channel: 'chrome',
  args: ['--enable-features=WebMCP,WebMCPTesting'],
};
const TOOL_COUNT = 19;

const { values: options } = parseArgs({
  options: {
    base: { type: 'string', default: 'http://localhost:4200' },
    scenario: { type: 'string', multiple: true },
    runs: { type: 'string', default: '1' },
    model: { type: 'string' },
    'judge-model': { type: 'string', default: 'sonnet' },
    'premises-only': { type: 'boolean', default: false },
  },
});

const here = dirname(fileURLToPath(import.meta.url));
const results = join(
  here,
  'results',
  new Date().toISOString().replace(/:/g, '-'),
);

// calls the page's WebMCP tools as an agent's browser would
async function withTools(url, use) {
  const browser = await chromium.launch(CHROME);
  try {
    const page = await browser.newPage({
      viewport: { width: 1600, height: 1000 },
    });
    await page.goto(url);
    await page.evaluate(async (count) => {
      for (let i = 0; i < 120; i++) {
        const tools = (await document.modelContext?.getTools()) ?? [];
        if (tools.length >= count) return;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      throw new Error('the page registered no WebMCP tools');
    }, TOOL_COUNT);
    const call = async (name, args = {}) => {
      const result = await page.evaluate(
        async ([name, args]) => {
          const tools = await document.modelContext.getTools();
          const tool = tools.find((t) => t.name === name);
          return document.modelContext.executeTool(tool, args);
        },
        [name, args],
      );
      try {
        return JSON.parse(result);
      } catch {
        return result;
      }
    };
    return await use(call);
  } finally {
    await browser.close();
  }
}

// runs checks in order; each may return facts for the rubric and the
// checks after it
async function runChecks(url, checks, facts = {}) {
  return withTools(url, async (call) => {
    const failed = [];
    for (const check of checks) {
      try {
        Object.assign(facts, (await check.check(call, facts)) ?? {});
      } catch (error) {
        failed.push(`${check.about}: ${error.message}`);
      }
    }
    return { failed, facts };
  });
}

const FINAL_URL =
  'End your answer with the URL of the view you leave the browser on, on a line of its own: URL: <the URL>';

// the URL the agent's answer ends on, on this run's GCV
function finalUrl(answer) {
  const urls = answer.match(/https?:\/\/\S+/g) ?? [];
  const url = urls.reverse().find((u) => u.startsWith(options.base));
  return url?.replace(/[)>.,`*]+$/, '');
}

function claude(prompt, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'claude',
      ['-p', '--output-format', 'json', '--no-session-persistence', ...args],
      { stdio: ['pipe', 'pipe', 'inherit'] },
    );
    let out = '';
    child.stdout.on('data', (chunk) => (out += chunk));
    child.on('error', reject);
    child.on('close', (code) => {
      try {
        resolve(JSON.parse(out));
      } catch {
        reject(new Error(`claude exited ${code}: ${out.slice(0, 500)}`));
      }
    });
    child.stdin.end(prompt);
  });
}

// the agent has GCV's tools, through a WebMCP browser, and nothing else
function agentConfig(dir) {
  const browserConfig = join(dir, 'playwright-mcp.json');
  writeFileSync(
    browserConfig,
    JSON.stringify({
      browser: {
        browserName: 'chromium',
        launchOptions: { ...CHROME, headless: true },
      },
    }),
  );
  const mcpConfig = join(dir, 'mcp.json');
  writeFileSync(
    mcpConfig,
    JSON.stringify({
      mcpServers: {
        gcv: {
          command: 'npx',
          // snapshots and logs go with the run's results
          args: [
            '-y',
            PLAYWRIGHT_MCP,
            '--config',
            browserConfig,
            '--isolated',
            '--output-dir',
            join(dir, 'browser'),
          ],
        },
      },
    }),
  );
  return [
    '--mcp-config',
    mcpConfig,
    '--strict-mcp-config',
    '--tools',
    '',
    '--allowedTools',
    'mcp__gcv',
    '--permission-mode',
    'dontAsk',
  ];
}

async function runAgent(scenario, dir) {
  const ending = scenario.outcome ? ` ${FINAL_URL}` : '';
  const prompt = `Open ${options.base}${scenario.url} in the browser and use the GCV tools the page provides. ${scenario.prompt}${ending}`;
  const args = agentConfig(dir);
  if (options.model) args.push('--model', options.model);
  return claude(prompt, args);
}

// rubric items may be written from the premises' facts
const rubricOf = (scenario, facts) =>
  scenario.rubric.map((r) => (typeof r === 'function' ? r(facts) : r));

async function judge(scenario, rubric, answer) {
  const items = rubric.map((r, i) => `${i + 1}. ${r}`).join('\n');
  const prompt = `You grade an answer against a rubric. Judge only what the answer says, not whether it is true. For each rubric item, decide whether the answer satisfies it and quote the passage that decides it (an empty quote if none).

Question: ${scenario.prompt}

Rubric:
${items}

Answer:
<answer>
${answer}
</answer>

Reply with only a JSON array, one object per rubric item, in order: [{"item": 1, "pass": true, "quote": "..."}]`;
  const reply = await claude(prompt, [
    '--tools',
    '',
    '--model',
    options['judge-model'],
  ]);
  const json = reply.result.slice(
    reply.result.indexOf('['),
    reply.result.lastIndexOf(']') + 1,
  );
  return JSON.parse(json).map((verdict, i) => ({
    ...verdict,
    rubric: rubric[i],
  }));
}

const chosen = scenarios.filter(
  (s) => !options.scenario || options.scenario.includes(s.id),
);
const summary = [];
for (const scenario of chosen) {
  const { failed, facts } = await runChecks(
    options.base + scenario.url,
    scenario.premises,
  );
  if (failed.length > 0) {
    console.log(`${scenario.id}: STALE, a premise no longer holds`);
    failed.forEach((f) => console.log(`  ${f}`));
    summary.push({ id: scenario.id, stale: failed });
    continue;
  }
  console.log(`${scenario.id}: premises hold`);
  if (options['premises-only']) continue;
  for (let run = 1; run <= Number(options.runs); run++) {
    const dir = join(results, `${scenario.id}-${run}`);
    mkdirSync(dir, { recursive: true });
    const agent = await runAgent(scenario, dir);
    const rubric = rubricOf(scenario, facts);
    const verdicts = agent.is_error
      ? []
      : await judge(scenario, rubric, agent.result);
    // the outcome checks count as rubric items, judged on the final view
    if (scenario.outcome && !agent.is_error) {
      const url = finalUrl(agent.result);
      const outcome = url
        ? (await runChecks(url, scenario.outcome, { ...facts })).failed
        : ['the answer gives no URL of the view'];
      scenario.outcome.forEach((check) => {
        const failure = outcome.find((f) => f.startsWith(`${check.about}:`));
        verdicts.push({
          pass: url !== undefined && failure === undefined,
          rubric: `The final view: ${check.about}`,
          quote: failure ?? url ?? outcome[0],
        });
      });
    }
    const of = rubric.length + (scenario.outcome?.length ?? 0);
    const passed = verdicts.filter((v) => v.pass).length;
    writeFileSync(
      join(dir, 'result.json'),
      JSON.stringify({ scenario: scenario.id, agent, verdicts }, null, 2),
    );
    console.log(
      `  run ${run}: ${agent.is_error ? 'agent error' : `${passed}/${of}`} (${dir})`,
    );
    verdicts
      .filter((v) => !v.pass)
      .forEach((v) => console.log(`    failed: ${v.rubric}`));
    summary.push({ id: scenario.id, run, passed, of });
  }
}
if (!options['premises-only']) {
  mkdirSync(results, { recursive: true });
  writeFileSync(
    join(results, 'summary.json'),
    JSON.stringify(summary, null, 2),
  );
}
process.exitCode = summary.some((s) => s.stale) ? 2 : 0;
