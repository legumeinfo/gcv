import { Action } from "@ngrx/store";
import { MacroTrack } from "../models/macro-track.model";
import { MacroTracks } from "../models/macro-tracks.model";

export const NEW = "[MULTI_MACRO_TRACKS] NEW";
export const ADD_CHROMOSOME = "[MULTI_MACRO_TRACKS] ADD_CHROMOSOME";
export const ADD_TRACKS = "[MULTI_MACRO_TRACKS] ADD_TRACKS";

export class New implements Action {
  readonly type = NEW;
  constructor(public correlationID: number) { }
}

export class AddChromosome implements Action {
  readonly type = ADD_CHROMOSOME;
  constructor(public correlationID: number, public payload: MacroTracks) { }
}

export class AddTracks implements Action {
  readonly type = ADD_TRACKS;
  constructor(public correlationID: number,
              public payload: {chromosome: string, tracks: MacroTrack[]}) { }
}

export type Actions = New | AddChromosome | AddTracks;
