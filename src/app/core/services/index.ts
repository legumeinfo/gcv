import { AppConfigService } from './app-config.service';
import { HttpService } from './http.service';
import { ScriptService } from './script.service';
import { TourService } from './tour.service';

export const services: any[] = [
  AppConfigService,
  ScriptService,
  TourService,
];

export * from './app-config.service';
export * from './http.service';
export * from './script.service';
export * from './tour.service';
