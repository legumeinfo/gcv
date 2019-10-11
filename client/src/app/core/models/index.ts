import { Config } from './config.model';
import { GET, POST, Request, Server } from './server.model';

export const models: any[] = [
  Config,
  GET,
  POST,
  Request,
  Server,
];

export * from './config.model';
export * from './server.model';
