import { createEntityAdapter, EntityState } from "@ngrx/entity";
import { createFeatureSelector, createSelector } from "@ngrx/store";
import * as localPlotsActions from "../actions/local-plots.actions";
import { Group } from "../models/group.model";

declare var Object: any;  // because TypeScript doesn't support Object.values

const adapter = createEntityAdapter<Group>();

export interface State extends EntityState<Group> {
  selectedPlotID: string | null;
}

const initialState: State = adapter.getInitialState({
  selectedPlotID: null,
});

export function reducer(
  state: State = initialState,
  action: localPlotsActions.Actions,
): State {
  switch (action.type) {
    case localPlotsActions.INIT:
      return initialState;
    case localPlotsActions.GET_SUCCESS:
      return adapter.addMany(action.payload.plots, state);
    case localPlotsActions.SELECT:
      return {
        ...state,
        selectedPlotID: action.payload.id,
      };
    default:
      return state;
  }
}

//export const {
//  // select the array of plot ids
//  selectIds: selectPlotIDs,
//  // select the dictionary of plot entities
//  selectEntities: selectPlotEntities,
//  // select the array of plots
//  selectAll: selectAllPlots,
//  // select the total plot count
//  selectTotal: selectPlotTotal
//} = adapter.getSelectors();

export const getLocalPlotsState = createFeatureSelector<State>('localPlots');

export const getAllPlots = createSelector(
  getLocalPlotsState,
  (state) => Object.values(state.entities),
)

export const getSelectedPlotID = createSelector(
  getLocalPlotsState,
  (state: State) => state.selectedPlotID,
)

export const getPlotByID = (id) => createSelector(
  getLocalPlotsState,
  (state: State) => {
    const entities = state.entities;
    if (id in entities) {
      return entities[id];
    }
    return null;
  },
);

export const getSelectedPlot = createSelector(
  getLocalPlotsState,
  (state) => {
    const id = state.selectedPlotID;
    const entities = state.entities;
    if (id in entities) {
      return entities[id];
    }
    return null;
  },
);
