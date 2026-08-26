// Angular + dependencies
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
// app
import { InterAppCommunicationService } from '@gcv/gene/services';

@Component({
  selector: 'gcv-inter-app-communication',
  templateUrl: './inter-app-communication.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class InterAppCommunicationComponent {
  private _communicationService = inject(InterAppCommunicationService);

  alert = {
    class: '',
    message: '',
    working: false,
  };

  private _typingTimer;
  private _doneTypingInterval = 1000; // 1 seconds

  constructor() {
    this._alert();
  }

  getChannel(): string {
    return this._communicationService.getChannel();
  }

  setChannel(channel: string): void {
    this._setAlert('info', 'Connecting', true);
    clearTimeout(this._typingTimer);
    this._typingTimer = setTimeout(() => {
      this._communicationService.setChannel(channel);
      this._alert();
    }, this._doneTypingInterval);
  }

  getCommunicate(): boolean {
    return this._communicationService.getCommunicate();
  }

  setCommunicate(communicate: boolean): void {
    this._communicationService.setCommunicate(communicate);
    this._alert();
  }

  private _setAlert(type, message, working = false): void {
    this.alert.class = `rounded-0 alert alert-${type}`;
    this.alert.message = message;
    this.alert.working = working;
  }

  private _alert(): void {
    const communicate = this.getCommunicate();
    const channel = this.getChannel();
    if (channel === '') {
      this._setAlert('danger', 'No channel!');
    } else if (communicate) {
      this._setAlert('success', 'Connected');
    } else if (!communicate) {
      this._setAlert('warning', 'Not connected');
    }
  }
}
