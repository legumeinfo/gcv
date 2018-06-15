// Angular
import { Injectable } from "@angular/core";

declare var defaultTour: any;

@Injectable()
export class TourService {

  constructor() {
    defaultTour.init();
  }

  startTour(): void {
    defaultTour.end();
    defaultTour.restart();
  }

  resumeTour(): void {
    defaultTour.start();
  }
}
