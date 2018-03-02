import { Action } from "@ngrx/store";
import { Group } from "../models/group.model";
import { MicroTracks } from "../models/micro-tracks.model";

export const NEW = "[MICRO_TRACKS] NEW";
export const ADD = "[MICRO_TRACKS] ADD";

export class New implements Action {
  readonly type = NEW;
  constructor(public correlationID: number) { }
}

export class Add implements Action {
  readonly type = ADD;
  constructor(public correlationID: number, public payload: MicroTracks) { }
}

export type Actions = New | Add;
