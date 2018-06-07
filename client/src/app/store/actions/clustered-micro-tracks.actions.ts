import { Action } from "@ngrx/store";
import { ClusteringParams, MicroTracks } from "../../models";

export const GET = "[CLUSTERED_MICRO_TRACKS] GET";
export const GET_SUCCESS = "[CLUSTERED_MICRO_TRACKS] GET_SUCCESS";

export class Get implements Action {
  readonly type = GET;
  constructor(public payload: {tracks: MicroTracks, params: ClusteringParams}) { }
}

export class GetSuccess implements Action {
  readonly type = GET_SUCCESS;
  constructor(public payload: {tracks: MicroTracks}) { }
}

export type Actions = Get | GetSuccess;
