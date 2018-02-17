import { Action } from "@ngrx/store";
import { MicroTracks } from "../models/micro-tracks.model";

export const NEW = "[MICRO_TRACKS] NEW";
export const ADD = "[MICRO_TRACKS] ADD";

// send a new set of micro tracks
export class New implements Action {
  readonly type = NEW;
  constructor() { }
}

// add to the micro tracks already in the store
export class Add implements Action {
  readonly type = ADD;
  constructor(public payload: MicroTracks) { }
}

export type Actions = New | Add;
