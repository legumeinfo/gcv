import { Action } from "@ngrx/store";
import { MacroTracks } from "../models/macro-tracks.model";

export const NEW = "[MACRO_TRACKS] NEW";
export const ADD = "[MACRO_TRACKS] ADD";

// send a new set of macro tracks
export class New implements Action {
  readonly type = NEW;
  constructor(public payload: MacroTracks) { }
}

// add to the macro tracks already in the store
export class Add implements Action {
  readonly type = ADD;
  constructor(public payload: MacroTracks) { }
}

export type Actions = New | Add;
