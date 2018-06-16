// Angular
import { Injectable } from "@angular/core";
// app
import { AppConfig } from "../app.config";

@Injectable()
export class TourService {

  currentTour: string;

  constructor() {
    for (const name of AppConfig.TOURS) {
      window[name].init();
      const onEnd = window[name]._options.onEnd;
      window[name]._options.onEnd = (tour) => {
        onEnd();
        this.currentTour = undefined;
      };
    }
  }

  startTour(name: string): void {
    if (window.hasOwnProperty(name)) {
      window[name].end();
      window[name].restart();
      this.currentTour = name;
    }
  }

  resumeTour(): void {
    if (this.currentTour !== undefined) {
      window[this.currentTour].start();
    }
  }
}
