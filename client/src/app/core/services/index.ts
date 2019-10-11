import { InterAppCommunicationService } from './inter-app-communication.service';
import { TourService } from './tour.service';

export const services: any[] = [
  InterAppCommunicationService,
  TourService,
];

export * from './inter-app-communication.service';
export * from './tour.service';
