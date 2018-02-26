import { Action } from "@ngrx/store";
import { Group } from "../models/group.model";
import { MicroTracks } from "../models/micro-tracks.model";

export const NEW = "[MICRO_TRACKS] NEW";
export const ADD = "[MICRO_TRACKS] ADD";

// send a new set of micro tracks
export class New implements Action {
  readonly type = NEW;
  constructor(public payload: number) { }
}

// add to the micro tracks already in the store
export class Add implements Action {
  readonly type = ADD;
  constructor(public correlationID: number, public payload: MicroTracks) { }
}

export type Actions = New | Add;
