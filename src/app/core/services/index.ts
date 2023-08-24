import { AppConfigService } from './app-config.service';
import { HttpService } from './http.service';
import { ScriptService } from './script.service';

export const services: any[] = [
  AppConfigService,
  ScriptService,
];

export * from './app-config.service';
export * from './http.service';
export * from './script.service';
