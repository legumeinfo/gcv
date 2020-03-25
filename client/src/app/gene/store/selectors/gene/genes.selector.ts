// NgRx
import { createSelectorFactory } from '@ngrx/store';
// store
import { State, geneID } from '@gcv/gene/store/reducers/gene.reducer';
import { getGeneState } from './gene-state.selector';
// app
import { arrayFlatten, memoizeArray } from '@gcv/core/utils';
import { Gene, Track } from '@gcv/gene/models';


const getGenesFromState =
(genes: string[], source: string, state: State): Gene[] => {
  return genes
    .map((name) => geneID(name, source))
    .filter((id: string) => id in state.entities)
    .map((id: string): Gene => state.entities[id]);
};


export const getGenesForSource = (genes: string[], source: string) => 
createSelectorFactory(memoizeArray)(
  getGeneState,
  (state: State): Gene[] => getGenesFromState(genes, source, state),
);


export const getGenesForTracks =
(tracks: Track[]) => createSelectorFactory(memoizeArray)(
  getGeneState,
  (state: State): Gene[] => {
    const trackGenes =
      tracks.map((t) => getGenesFromState(t.genes, t.source, state));
    return arrayFlatten(trackGenes);
  }
);
