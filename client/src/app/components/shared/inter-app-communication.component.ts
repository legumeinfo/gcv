// Angular + dependencies
import { Component } from "@angular/core";
// app
import { Alert } from "../../models";
import { InterAppCommunicationService } from "../../services";

@Component({
  selector: "inter-app-communication",
  templateUrl: "./inter-app-communication.component.html",
})
export class InterAppCommunicationComponent {

  public alert: Alert;

  private _typingTimer;
  private _doneTypingInterval = 1000;  // 1 seconds

  constructor(private _communicationService: InterAppCommunicationService) {
    this._setAlert();
  }

  getChannel(): string {
    return this._communicationService.getChannel();
  }

  setChannel(channel: string): void {
    this.alert = new Alert("info", "Connecting", {spinner: true});
    clearTimeout(this._typingTimer);
    this._typingTimer = setTimeout(() => {
      this._communicationService.setChannel(channel);
      this._setAlert();
    }, this._doneTypingInterval);
  }

  getCommunicate(): boolean {
    return this._communicationService.getCommunicate();
  }

  setCommunicate(communicate: boolean): void {
    this._communicationService.setCommunicate(communicate);
    this._setAlert();
  }

  private _setAlert(): void {
    const communicate = this.getCommunicate();
    const channel = this.getChannel();
    if (channel === "") {
      this.alert = new Alert("danger", "No channel!");
    } else if (communicate) {
      this.alert = new Alert("success", "Connected");
    } else if (!communicate) {
      this.alert = new Alert("warning", "Not connected");
    }
  }
}
