import { AppConfig } from '@gcv/core/models';
import { Params } from '@gcv/search/models/params';


export const initialState: Params = {
  // sources
  sources: AppConfig.getServerIDs(),
};
