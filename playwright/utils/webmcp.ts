import { Page } from '@playwright/test';

// Stands in for the browser's WebMCP before the app loads: the app
// registers its tools on document.modelContext, which keeps them for
// callTool. Call it before page.goto.
export async function standInForWebMcp(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const tools: Record<string, unknown> = {};
    const modelContext = {
      registerTool: (tool: { name: string }) => {
        tools[tool.name] = tool;
      },
      unregisterTool: (name: string) => {
        delete tools[name];
      },
    };
    Object.defineProperty(document, 'modelContext', {
      value: modelContext,
      configurable: true,
    });
    (window as unknown as { __gcvTools: unknown }).__gcvTools = tools;
  });
}

// runs a tool as an agent would, returning its result: parsed JSON, or the
// text it returned
export async function callTool<T = unknown>(
  page: Page,
  name: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  await page.waitForFunction(
    (name) =>
      (window as unknown as { __gcvTools?: Record<string, unknown> })
        .__gcvTools?.[name] !== undefined,
    name,
    { timeout: 60000 },
  );
  const result = await page.evaluate(
    async ([name, args]) => {
      const tools = (
        window as unknown as {
          __gcvTools: Record<
            string,
            { execute: (a: unknown, o: unknown) => Promise<unknown> }
          >;
        }
      ).__gcvTools;
      const r = await tools[name].execute(args, {
        signal: new AbortController().signal,
      });
      return typeof r === 'string' ? r : JSON.stringify(r);
    },
    [name, args] as const,
  );
  try {
    return JSON.parse(result) as T;
  } catch {
    return result as T;
  }
}
