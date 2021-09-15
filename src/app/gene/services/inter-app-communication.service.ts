// Angular
import { Injectable } from '@angular/core';
// store
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
// app
import { AppConfig } from '@gcv/app.config';

@Injectable()
export class InterAppCommunicationService {

  private _bc;
  private _channel: string;
  private _communicate: boolean;
  private _messages = new Subject<any>();

  constructor() {
    this.setChannel(AppConfig.COMMUNICATION.channel);
    this.setCommunicate(AppConfig.COMMUNICATION.communicate);
  }

  // private

  private _open(): void {
    this._bc = new BroadcastChannel(this._channel);
    this._bc.onmessage = (message) => {
      this._messages.next(message);
    };
  }

  private _close(): void {
    if (this._bc !== undefined) {
      this._bc.close();
      this._bc = undefined;
    }
  }

  // public

  getChannel(): string {
    return this._channel;
  }

  getMessages(): Observable<any> {
    return this._messages.asObservable();
  }

  setChannel(channel: string): void {
    this._channel = channel;
    if (this._communicate) {
      this._close();
      if (this._channel) {
        this._open();
      } else {
        this._communicate = false;
      }
    }
  }

  getCommunicate(): boolean {
    return this._communicate;
  }

  setCommunicate(communicate: boolean): void {
    if (!(communicate && !this._channel)) {
      if (this._communicate && !communicate) {
        this._close();
      } else if (!this._communicate && communicate) {
        this._open();
      }
      this._communicate = communicate;
    }
  }

  postMessage(message: any): void {
    if (this._communicate) {
      this._bc.postMessage(message);
    }
  }

}
