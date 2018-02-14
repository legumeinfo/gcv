import { Action } from "@ngrx/store";
import { MicroTracks } from "../models/micro-tracks.model";

export const NEW = "[CLUSTERED_MICRO_TRACKS] NEW";
export const ADD = "[CLUSTERED_MICRO_TRACKS] ADD";

// send a new set of clustered micro tracks
export class New implements Action {
  readonly type = NEW;
  constructor(public payload: MicroTracks) { }
}

// add to the clustered micro tracks already in the store
export class Add implements Action {
  readonly type = ADD;
  constructor(public payload: MicroTracks) { }
}

export type Actions = New | Add;
