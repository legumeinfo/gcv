// App-project-only Jest setup (see jest.config.ts), running after setup-jest.ts.
//
// Several app modules read the AppConfig singleton at import time — e.g.
// params.reducer's initial state calls AppConfig.getServerIDs(), and
// source.model does the same. In production AppConfig is populated by an
// APP_INITIALIZER before any of that runs; under Jest we stand up a minimal
// singleton here so those modules can be imported without a live config load.
// Specs that need specific config reuse this instance (AppConfig.instance) and
// overwrite the fields they care about.
import { AppConfig, Server } from '@gcv/core/models';

if (!AppConfig.instance) {
  const config = new AppConfig();
  config.servers = [
    { id: 'lis', name: 'Legume Information System', search: {} },
  ] as unknown as Server[];
  config.miscellaneous = { searchHelpText: '' } as any;
  config.defaultParameters = {} as any;
}
