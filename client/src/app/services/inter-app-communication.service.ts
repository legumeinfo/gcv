// Angular
import { Injectable } from "@angular/core";
// store
import { Observable, Subject } from "rxjs";
import { filter } from "rxjs/operators";
// app
import { AppConfig } from "../app.config";
import { MicroTracks } from "../models";

@Injectable()
export class InterAppCommunicationService {
  messages: Observable<any>;
  private _messages = new Subject<any>();

  private _bc;
  private _channel: string;
  private _communicate: boolean;

  constructor() {
    this.messages = this._messages.asObservable();
    this.setChannel(AppConfig.COMMUNICATION.channel);
    this.setCommunicate(AppConfig.COMMUNICATION.communicate);
  }

  getChannel(): string {
    return this._channel;
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

  postMessage(message: any, enrich?: MicroTracks): void {
    if (this._communicate) {
      if (enrich !== undefined) {
        message = this.enrich(message, enrich);
      }
      this._bc.postMessage(message);
    }
  }

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

  private enrich(message: any, microTracks: MicroTracks): any {
    if (message.targets.hasOwnProperty("family") &&
        !message.targets.hasOwnProperty("genes")) {
      const genes = microTracks.groups
        .reduce((familyGenes, group) => {
          const groupGenes = group.genes
            .reduce((filteredGenes, gene) => {
              if (gene.family === message.targets.family) {
                filteredGenes.push(gene.name);
              }
              return filteredGenes;
            }, []);
          familyGenes.push(...groupGenes);
          return familyGenes;
        }, []);
      message = {type: message.type, targets: {genes, ...message.targets}};
    }
    return message;
  }
}
