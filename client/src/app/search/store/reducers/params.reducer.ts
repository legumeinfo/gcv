import { AppConfig } from '@gcv/app.config';
import { Params } from '@gcv/search/models/params';


export const initialState: Params = {
  // sources
  sources: AppConfig.SERVERS.map((s) => s.id),
};
