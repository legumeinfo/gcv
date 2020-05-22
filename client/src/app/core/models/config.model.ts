import { Server } from './server.model';

export class Brand {
  favicon?: string;
  url?: string;
  img?: string;
  name?: string;
  slogan?: string;
  hide?: boolean;
}

export class Communication {
  communicate?: boolean;
  channel?: string;
}

export class DashboardView {
  img?: string;  // URL to example screenshot
  caption?: string;
}

export class Dashboard {
  gcvScreenshot?: DashboardView;
  trackScreenshot?: DashboardView;
  microsyntenyScreenshot?: DashboardView;
  dotplotsScreenshot?: DashboardView;
  macrosyntenyScreenshot?: DashboardView;
  examples?: string[];  // each string should contain HTML with a description and link to an example
}

export class Miscellaneous {
  searchHelpText?: string;
}

export class Tour {
  script: string;
  name: string;
}

export class Config {
  brand?: Brand;
  communication?: Communication;
  dashboard?: Dashboard;
  miscellaneous?: Miscellaneous;
  tours?: Tour[];
  servers: Server[];
}
