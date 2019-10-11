// NgRx
import { createSelector } from '@ngrx/store';
// store
import { initialState } from '@gcv/gene/store/reducers/micro-tracks.reducer'; 
import { getMicroTracksState } from './micro-tracks-state.selector';
import { getSelectedMicroTracks } from './selected-micro-tracks.selector';
// app
import { Track } from '@gcv/gene/models';


export const getLoadedMicroTracks = createSelector(
  getMicroTracksState,
  // TODO: can initialState be handled upstream?
  (state=initialState) => {
    return Object.values(state.entities);
  }
);

export const getAllMicroTracks = createSelector(
  getSelectedMicroTracks,
  getLoadedMicroTracks,
  (selectedTracks: Track[], loadedTracks: Track[]) => {
    return selectedTracks.concat(loadedTracks);
  }
);

//export const selectedLoaded = fromChromosome.selectedLoaded;
