import { Action } from "@ngrx/store";
import { Group } from "../models/group.model";
import { MicroTracks } from "../models/micro-tracks.model";

export const NEW = "[ALIGNED_MICRO_TRACKS] NEW";
export const ADD = "[ALIGNED_MICRO_TRACKS] ADD";

// send a new set of aligned micro tracks
export class New implements Action {
  readonly type = NEW;
  constructor(public payload?: Group) { }
}

// add to the aligned micro tracks already in the store
export class Add implements Action {
  readonly type = ADD;
  constructor(public payload: MicroTracks) { }
}

export type Actions = New | Add;