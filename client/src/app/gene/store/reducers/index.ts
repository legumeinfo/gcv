// app
import { environment } from '@gcv-environments/environment';
// store
import { Action, ActionReducerMap, combineReducers, createFeatureSelector }
  from '@ngrx/store';
import { storeFreeze } from 'ngrx-store-freeze';
// reducers
import * as fromRoot from '@gcv/reducers';
import * as fromPairwiseBlocks from './pairwise-blocks.reducer';
import * as fromChromosome from './chromosome.reducer';
import * as fromGene from './gene.reducer';
import * as fromMicroTracks from './micro-tracks.reducer';


export const geneFeatureKey = 'genemodule';


export interface GeneState {
  [fromPairwiseBlocks.pairwiseBlocksFeatureKey]: fromPairwiseBlocks.State;
  [fromChromosome.chromosomeFeatureKey]: fromChromosome.State;
  [fromGene.geneFeatureKey]: fromGene.State;
  [fromMicroTracks.microTracksFeatureKey]: fromMicroTracks.State;
}


export interface State extends fromRoot.State {
  [geneFeatureKey]: GeneState;
}


export function reducers(state: GeneState | undefined, action: Action) {
  return combineReducers({
    [fromPairwiseBlocks.pairwiseBlocksFeatureKey]: fromPairwiseBlocks.reducer,
    [fromChromosome.chromosomeFeatureKey]: fromChromosome.reducer,
    [fromGene.geneFeatureKey]: fromGene.reducer,
    [fromMicroTracks.microTracksFeatureKey]: fromMicroTracks.reducer,
  })(state, action);
}

// select the module's state
export const getGeneModuleState = createFeatureSelector<State, GeneState>
  (geneFeatureKey);
