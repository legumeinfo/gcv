import { AppConfig, Server } from '@gcv/core/models';
import { appWebMcpTools } from './app.tools';
import { NEEDS_GENE_VIEW } from './gene-view.host';
import { TOOL_GUIDE } from './guide';

describe('the agent guide', () => {
  let servers: Server[];

  beforeEach(() => {
    servers = AppConfig.instance.servers;
    AppConfig.instance.servers = [
      { id: 'lis', name: 'LIS', microSearch: {} },
    ] as unknown as Server[];
  });

  afterEach(() => {
    AppConfig.instance.servers = servers;
  });

  it('lists every registered tool, in registration order', async () => {
    const guided = TOOL_GUIDE.flatMap((g) => g.tools.map((t) => t.name));
    expect(guided).toEqual((await appWebMcpTools()).map((t) => t.name));
  });

  it('marks exactly the tools outside the start group as needing a gene view', async () => {
    const start = new Set(
      TOOL_GUIDE.find((g) => g.group === 'start').tools.map((t) => t.name),
    );
    (await appWebMcpTools()).forEach((tool) =>
      expect([tool.name, tool.description.endsWith(NEEDS_GENE_VIEW)]).toEqual([
        tool.name,
        !start.has(tool.name),
      ]),
    );
  });
});
