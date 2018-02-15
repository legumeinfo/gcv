import * as searchQueryTrackActions from "../actions/search-query-track.actions";
import { Gene } from "../models/gene.model";

// interface that Group implements
export interface State {
  species_id: number;
  genus: string;
  species: string;
  chromosome_id: number;
  chromosome_name: string;
  genes: Gene[];
  source?: string;
  id: number;
  score?: number;
  cluster?: number;
}

export function reducer(state, action: searchQueryTrackActions.Actions): State {
  switch (action.type) {
    case searchQueryTrackActions.NEW:
      return action.payload;
    default:
      return state;
  }
}
