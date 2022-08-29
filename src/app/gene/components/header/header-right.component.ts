// Angular
import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
// app
import { GCV } from '@gcv-assets/js/gcv';
import { AppConfig } from '@gcv/core/models';
import { InterAppCommunicationService } from '@gcv/gene/services';


@Component({
  selector: 'gcv-header-right',
  styles: [],
  template: `
    <ul class="navbar-nav me-auto">
      <li *ngIf="communicate" class="nav-item dropdown">
        <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="fas fa-broadcast-tower"></i>
        </a>
        <div class="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownMenuLink">
          <gcv-inter-app-communication></gcv-inter-app-communication>
        </div>
      </li>
    </ul>
  `,
})
export class HeaderRightComponent implements OnDestroy {

  communicate: boolean;

  private _destroy: Subject<boolean> = new Subject();
  private _eventBus;

  constructor(private _appConfig: AppConfig,
              private _communicationService: InterAppCommunicationService) {
    this.communicate = _appConfig.communication.channel !== undefined;
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
