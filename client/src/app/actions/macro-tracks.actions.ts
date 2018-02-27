import { Action } from "@ngrx/store";
import { MacroTrack } from "../models/macro-track.model";
import { MacroTracks } from "../models/macro-tracks.model";

export const NEW = "[MACRO_TRACKS] NEW";
export const ADD = "[MACRO_TRACKS] ADD";

// send a new set of macro tracks
export class New implements Action {
  readonly type = NEW;
  constructor(public correlationID: number, public payload: MacroTracks) { }
}

// add to the macro tracks already in the store
export class Add implements Action {
  readonly type = ADD;
  constructor(public correlationID: number, public payload: MacroTrack[]) { }
}

export type Actions = New | Add;
