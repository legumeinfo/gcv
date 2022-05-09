// store
import { Action, combineReducers, createFeatureSelector } from '@ngrx/store';
// reducers
import * as fromRoot from '@gcv/store/reducers';
import * as fromPairwiseBlocks from './pairwise-blocks.reducer';
import * as fromChromosome from './chromosome.reducer';
import * as fromFamily from './family.reducer';
import * as fromGene from './gene.reducer';
import * as fromLayout from './layout.reducer';
import * as fromMicroTracks from './micro-tracks.reducer';


export const geneFeatureKey = 'genemodule';


export interface GeneState {
  [fromPairwiseBlocks.pairwiseBlocksFeatureKey]: fromPairwiseBlocks.State;
  [fromChromosome.chromosomeFeatureKey]: fromChromosome.State;
  [fromFamily.familyFeatureKey]: fromFamily.State;
  [fromGene.geneFeatureKey]: fromGene.State;
  [fromLayout.layoutFeatureKey]: fromLayout.State;
  [fromMicroTracks.microTracksFeatureKey]: fromMicroTracks.State;
}


export interface State extends fromRoot.State {
  [geneFeatureKey]: GeneState;
}


export function reducers(state: GeneState | undefined, action: Action) {
  return combineReducers({
    [fromPairwiseBlocks.pairwiseBlocksFeatureKey]: fromPairwiseBlocks.reducer,
    [fromChromosome.chromosomeFeatureKey]: fromChromosome.reducer,
    [fromFamily.familyFeatureKey]: fromFamily.reducer,
    [fromGene.geneFeatureKey]: fromGene.reducer,
    [fromLayout.layoutFeatureKey]: fromLayout.reducer,
    [fromMicroTracks.microTracksFeatureKey]: fromMicroTracks.reducer,
  })(state, action);
}

// select the module's state
export const getGeneModuleState = createFeatureSelector< GeneState>
  (geneFeatureKey);
