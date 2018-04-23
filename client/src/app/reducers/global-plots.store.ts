import { createEntityAdapter, EntityState } from "@ngrx/entity";
import { createFeatureSelector, createSelector } from "@ngrx/store";
import * as globalPlotsActions from "../actions/global-plots.actions";
import { Group } from "../models/group.model";

const adapter = createEntityAdapter<Group>({
  selectId: (e) => e.chromosome_id,
});

export interface State extends EntityState<Group> {
  selectedPlotID: string | null;
  failed: string[];
  loaded: string[];
  loading: string[];
}

const initialState: State = adapter.getInitialState({
  selectedPlotID: null,
  failed: [],
  loaded: [],
  loading: [],
});

export function reducer(
  state: State = initialState,
  action: globalPlotsActions.Actions,
): State {
  switch (action.type) {
    case globalPlotsActions.INIT:
      return initialState;
    case globalPlotsActions.GET:
      return {
        ...state,
        loading: state.loading.concat([action.payload.local.source]),
      };
    case globalPlotsActions.GET_SUCCESS:
    {
      const source = action.payload.plot.source;
      return adapter.addOne(
        action.payload.plot,
        {
          ...state,
          loaded: state.loaded.concat(source),
          loading: state.loading.filter((s) => s !== source),
        },
      );
    }
    case globalPlotsActions.GET_FAILURE:
    {
      const source = action.payload.source;
      return {
        ...state,
        failed: state.failed.concat(source),
        loading: state.loading.filter((s) => s !== source),
      };
    }
    case globalPlotsActions.SELECT:
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

export const getGlobalPlotsState = createFeatureSelector<State>('globalPlots');

export const getPlotByID = (id) => createSelector(
  getGlobalPlotsState,
  (state: State) => {
    const entities = state.entities;
    if (id in entities) {
      return entities[id];
    }
    return null;
  },
);

export const hasPlot = (id) => createSelector(
  getGlobalPlotsState,
  (state: State) => {
    const entities = state.entities;
    return id in entities;
  },
);

export const getSelectedPlotID = createSelector(
  getGlobalPlotsState,
  (state: State) => state.selectedPlotID,
)

export const getSelectedPlot = createSelector(
  getGlobalPlotsState,
  getSelectedPlotID,
  (state: State, id: string) => {
    const entities = state.entities;
    if (id in entities) {
      return entities[id];
    }
    return undefined;
  },
);

export const getGlobalPlotsLoadState = createSelector(
  getGlobalPlotsState,
  (state) => {
    return {
      failed: state.failed,
      loading: state.loading,
      loaded: state.loaded,
    };
  }
)
