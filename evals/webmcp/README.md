# WebMCP scenarios

Questions with answers known from the data, for measuring how well agents use GCV's WebMCP
tools and instructions. Run them after changing a tool's description, its results or the
guide (`src/app/webmcp/guide.ts`), and compare pass rates before and after.

Each scenario in `scenarios.mjs` has:

- **premises**: checks, made with the tools themselves, of the facts the rubric relies on.
  When the data changes and a premise no longer holds, the scenario reports itself stale
  instead of failing agents.
- **a prompt** for the agent, which gets a browser on the scenario's view and only GCV's
  tools.
- **a rubric**: statements a separate judge checks against the agent's final answer. They
  test what the guide asks of agents: findings that hold up across parameters, claims tied to
  views, absence reported as absence, nothing inferred that GCV can't show.

## Running

The scenarios need GCV with its WebMCP tools (e.g. `npm start`), Google Chrome, whose
WebMCP the runner enables with `--enable-features=WebMCP,WebMCPTesting`, and the `claude`
CLI. Agents and the judge use your Claude account.

```sh
node evals/webmcp/run.mjs --premises-only                  # check the data still holds
node evals/webmcp/run.mjs                                  # every scenario, one run each
node evals/webmcp/run.mjs --scenario lupin-copies --runs 5 --model sonnet
```

Options: `--base` (default `http://localhost:4200`), `--scenario` (repeatable), `--runs`,
`--model` (the agent's), `--judge-model` (default `sonnet`). Each run writes the agent's
reply, with its cost and turns, and the judge's verdicts to `results/<time>/`, which git
ignores. Agents vary, so compare pass rates over several runs, not single answers.

## Adding a scenario

Take the question from a real session, ideally one a domain expert corrected: the lupin
scenarios come from an agent that loosened thresholds into a chance match. Write premises
that pin the facts with tool calls, and rubric statements that a reader can decide from the
answer alone.
