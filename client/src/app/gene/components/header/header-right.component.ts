// Angular
import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
// app
import { GCV } from '@gcv-assets/js/gcv';
import { AppConfig } from '@gcv/app.config';
import { InterAppCommunicationService } from '@gcv/gene/services';


@Component({
  selector: 'gcv-header-right',
  styles: [],
  template: `
    <ul class="navbar-nav mr-auto">
      <li *ngIf="communicate" class="nav-item dropdown">
        <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          <i class="fas fa-broadcast-tower"></i>
        </a>
        <div class="dropdown-menu dropdown-menu-right" aria-labelledby="navbarDropdown">
          <gcv-inter-app-communication></gcv-inter-app-communication>
        </div>
      </li>
      <li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown"  data-display="static" data-boundary="viewport" aria-haspopup="true" aria-expanded="false">
          Help
        </a>
        <div class="dropdown-menu dropdown-menu-right" aria-labelledby="navbarDropdown">
          <a class="dropdown-item" [routerLink]="['/instructions']" target="_blank">Instructions</a>
          <a class="dropdown-item" href="https://github.com/legumeinfo/lis_context_viewer/wiki" target="_blank">Documentation</a>
          <a class="dropdown-item" href="https://doi.org/10.1093/bioinformatics/btx757" target="_blank">Manuscript</a>
          <div class="dropdown-divider"></div>
          <a class="dropdown-item" href="https://github.com/legumeinfo/lis_context_viewer/issues" target="_blank">Contact developers</a>
        </div>
      </li>
    </ul>
  `,
})
export class HeaderRightComponent implements OnDestroy {

  communicate: boolean = AppConfig.COMMUNICATION.channel !== undefined;

  private _destroy: Subject<boolean> = new Subject();
  private _eventBus;

  constructor(private _communicationService: InterAppCommunicationService) {
    if (this.communicate) {
      this._setupCommunication();
    }
  }

  // Angular hooks

  ngOnDestroy(): void { 
    if (this.communicate) {
      this._eventBus.unsubscribe();
    }
    this._destroy.next(true);
    this._destroy.complete();
  }

  // private

  private _setupCommunication(): void {
    this._communicationService.getMessages()
      .pipe(takeUntil(this._destroy))
      .subscribe((message) => {
        message.data.flag = true;
        GCV.common.eventBus.publish(message.data);
      });
    this._eventBus = GCV.common.eventBus.subscribe((event) => {
      if (!event.flag) {
        this._communicationService.postMessage(event);
      }
    });
  }

}
