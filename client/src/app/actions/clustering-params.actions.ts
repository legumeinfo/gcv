import { Action } from "@ngrx/store";
import { ClusteringParams } from "../models/clustering-params.model";

export const NEW = "[CLUSTERING_PARAMS] NEW";

export class New implements Action {
  readonly type = NEW;
  constructor(public payload: ClusteringParams) { }
}

export type Actions = New;
