// Angular
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, combineLatest, empty, merge } from 'rxjs';
import { distinct, filter, map, mergeAll, scan, startWith, switchMap }
  from 'rxjs/operators';
// store
import { Store, select } from '@ngrx/store';
import { GeneID, geneID } from '@gcv/gene/store/reducers/gene.reducer';
import { microTrackID, partialMicroTrackID }
  from '@gcv/gene/store/reducers/micro-tracks.reducer';
import { pairwiseBlocksID }
  from '@gcv/gene/store/reducers/pairwise-blocks.reducer';
import * as layoutActions from '@gcv/gene/store/actions/layout.actions';
import * as fromRoot from '@gcv/store/reducers';
import * as fromChromosome from '@gcv/gene/store/selectors/chromosome';
import * as fromGenes from '@gcv/gene/store/selectors/gene';
import * as fromLayout from '@gcv/gene/store/selectors/layout';
import * as fromMicroTracks from '@gcv/gene/store/selectors/micro-tracks';
import * as fromPairwiseBlocks from '@gcv/gene/store/selectors/pairwise-blocks';
import * as fromParams from '@gcv/gene/store/selectors/params';
import * as fromPlots from '@gcv/gene/store/selectors/plots';
// app
import { arrayFlatten, setIntersection } from '@gcv/core/utils';
import { PairwiseBlocks, Plot, Process, ProcessStatus, ProcessStatusStream,
  ProcessStatusWord, ProcessStream, Track } from '@gcv/gene/models';
import { ClusterMixin } from '@gcv/gene/models/mixins';
import { trackMap } from '@gcv/gene/models/shims';
import { TrackID, trackID } from '@gcv/gene/store/utils';


@Injectable()
export class ProcessService {

  constructor(private _store: Store<fromRoot.State>) { }

  // private helpers

  private _genesAndLoadStateToStatus(genes: string[], source: string,
  loading: GeneID[], loaded: GeneID[], failed: GeneID[]): ProcessStatus {
    const geneSet = new Set(genes);
    // filter loading states by gene name and source
    const loadStateFilter = (id) => {
        return geneSet.has(id.name) && id.source == source;
      };
    // generate the status based on the load states
    const filteredLoading = loading.filter(loadStateFilter);
    if (filteredLoading.length > 0) {
      return {
        word: 'process-running',
        description: `Loading genes from <b>${source}</b>`,
      };
    }
    const filteredLoaded = loaded.filter(loadStateFilter);
    if (filteredLoaded.length == geneSet.size) {
      return {
        word: 'process-success',
        description: `Successfully loaded all genes from <b>${source}</b>`,
      };
    }
    const filteredFailed = failed.filter(loadStateFilter);
    if (filteredFailed.length == geneSet.size) {
      return {
        word: 'process-error',
        description: `Failed to load genes from <b>${source}</b>`,
      };
    }
    return {
      word: 'process-warning',
      description: `Failed to load one or more genes from <b>${source}</b>`
    };
  }

  private _defaultProcessStatusFactory(description): ProcessStatus {
    return {
      word: 'process-waiting',
      description,
    };
  }

  // top

  private _getQueryGeneSubprocess(id: GeneID): ProcessStatusStream {
    let {name, source} = id;
    const idString = geneID(id);
    return combineLatest(
      this._store.select(fromGenes.getLoading),
      this._store.select(fromGenes.getLoaded),
      this._store.select(fromGenes.getFailed),
    ).pipe(
      map(([loading, loaded, failed]) => {
        const loadingStrings = new Set(loading.map((g) => geneID(g)));
        if (loadingStrings.has(idString)) {
          return {
            word: 'process-running',
            description: `Loading <b>${name}</b> from <b>${source}</b>`,
          };
        }
        const loadedStrings = new Set(loaded.map((g) => geneID(g)));
        if (loadedStrings.has(idString)) {
          return {
            word: 'process-success',
            description: `Successfully loaded <b>${name}</b> from <b>${source}</b>`,
          };
        }
        const failedStrings = new Set(failed.map((g) => geneID(g)));
        if (failedStrings.has(idString)) {
          return {
            word: 'process-error',
            description: `Failed to load <b>${name}</b> from <b>${source}</b>`,
          };
        }
        return {
          word: 'process-warning',
          description: `No status for <b>${name}</b> from <b>${source}</b>`,
        };
      }),
    );
  }

  private _getQueryGeneSubprocesses(geneIDs: GeneID[]):
  Observable<ProcessStatusStream> {
    return Observable.create((observer) => {
      geneIDs.forEach((id) => {
        const subproccess = this._getQueryGeneSubprocess(id);
        observer.next(subproccess);
      });
      observer.complete();
    });
  }

  private
  _getQueryGeneProcessStatus(subprocesses: Observable<ProcessStatusStream>):
  ProcessStatusStream {
    return subprocesses.pipe(
      // aggregate subprocesses into array
      scan((accumulator, processStatus) => {
        accumulator.push(processStatus);
        return accumulator;
      }, []),
      // derive status from array
      switchMap((subs): ProcessStatusStream => {
        return combineLatest(...subs).pipe(
          map((subStates): ProcessStatus => {
            const words = new Set(subStates.map((status) => status.word));
            let word: ProcessStatusWord;
            let description: string;
            if (words.has('process-running')) {
              word = 'process-running';
              description = 'Loading query genes';
            // all success
            } else if (words.has('process-success') && words.size == 1) {
              word = 'process-success';
              description = 'All query genes successfully loaded';
            // all error
            } else if (words.has('process-error') && words.size == 1) {
              word = 'process-error';
              description = 'Failed to load query genes';
            // success and error
            } else {
              word = 'process-warning';
              description = 'Failed to load one or more query genes';
            }
            return {word, description};
          }),
        );
      }),
    );
  }

  getQueryGeneProcess(): ProcessStream {
    // emit a new process every time the set of query genes changes
    return this._store.select(fromGenes.getSelectedGeneIDs).pipe(
      map((geneIDs): Process => {
        const subprocesses = this._getQueryGeneSubprocesses(geneIDs);
        return {
          subprocesses,
          status: this._getQueryGeneProcessStatus(subprocesses),
        };
      }),
    );
  }

  private _getQueryTrackSubprocess(id: TrackID): ProcessStatusStream {
    let {name, source} = id;
    const idString = trackID(id);
    return combineLatest(
      this._store.select(fromChromosome.getLoading),
      this._store.select(fromChromosome.getLoaded),
      this._store.select(fromChromosome.getFailed),
    ).pipe(
      map(([loading, loaded, failed]) => {
        const loadingStrings = new Set(loading.map((c) => trackID(c)));
        if (loadingStrings.has(idString)) {
          return {
            word: 'process-running',
            description: `Loading <b>${name}</b> from <b>${source}</b>`,
          };
        }
        const loadedStrings = new Set(loaded.map((c) => trackID(c)));
        if (loadedStrings.has(idString)) {
          return {
            word: 'process-success',
            description: `Successfully loaded <b>${name}</b> from <b>${source}</b>`,
          };
        }
        const failedStrings = new Set(failed.map((c) => trackID(c)));
        if (failedStrings.has(idString)) {
          return {
            word: 'process-error',
            description: `Failed to load <b>${name}</b> from <b>${source}</b>`,
          };
        }
        return {
          word: 'process-warning',
          description: `No status for <b>${name}</b> from <b>${source}</b>`,
        };
      }),
    );
  }

  private _getQueryTrackSubprocesses(): Observable<ProcessStatusStream> {
    return this._store.select(fromChromosome.getSelectedChromosomeIDs).pipe(
      // flatten arrays into single emissions
      mergeAll(),
      // only let distinct IDs through
      distinct((id: TrackID) => trackID(id)),
      // convert IDs to subprocesses
      map((id) => this._getQueryTrackSubprocess(id)),
    );
  }

  private _getQueryTrackProcessStatus(subprocesses: Observable<ProcessStatusStream>):
  ProcessStatusStream {
    const defaultDescription = 'Waiting for query genes';
    const defaultStatus = this._defaultProcessStatusFactory(defaultDescription);
    return subprocesses.pipe(
      // aggregate subprocesses into array
      scan((accumulator, processStatus) => {
        accumulator.push(processStatus);
        return accumulator;
      }, []),
      // derive status from array
      switchMap((subs): ProcessStatusStream => {
        return combineLatest(...subs).pipe(
          map((subStates): ProcessStatus => {
            const words = new Set(subStates.map((status) => status.word));
            let word: ProcessStatusWord;
            let description: string;
            if (words.has('process-running')) {
              word = 'process-running';
              description = 'Loading query tracks';
            // all success
            } else if (words.has('process-success') && words.size == 1) {
              word = 'process-success';
              description = 'All query tracks successfully loaded';
            // all error
            } else if (words.has('process-error') && words.size == 1) {
              word = 'process-error';
              description = 'Failed to load query tracks';
            // success and error
            } else {
              word = 'process-warning';
              description = 'Failed to load one or more query tracks';
            }
            return {word, description};
          }),
        );
      }),
      startWith(defaultStatus),
    );
  }

  getQueryTrackProcess(): ProcessStream {
    // emit a new process every time the set of query genes changes
    return this._store.select(fromGenes.getSelectedGeneIDs).pipe(
      map((geneIDs): Process => {
        const subprocesses = this._getQueryTrackSubprocesses();
        return {
          subprocesses,
          status: this._getQueryTrackProcessStatus(subprocesses),
        };
      }),
    );
  }

  private _getClusteringProcessStatus(): ProcessStatusStream {
    const defaultDescription = 'Waiting for query tracks';
    const defaultStatus = this._defaultProcessStatusFactory(defaultDescription);
    return combineLatest(
      this._store.select(fromGenes.getSelectedGenesLoaded),
      this._store.select(fromChromosome.getSelectedChromosomesLoaded),
      this._store.select(fromMicroTracks.getClusteredSelectedMicroTracks),
    ).pipe(
      filter(([genesLoaded, chromosomesLoaded, tracks]) => {
        return genesLoaded && chromosomesLoaded;
      }),
      map(([genesLoaded, chromosomesLoaded, tracks]): ProcessStatus => {
        const clusterIDs = new Set(tracks.map((t) => t.cluster));
        const numClusters = clusterIDs.size;
        const numTracks = tracks.length;
        let word: ProcessStatusWord;
        let description: string;
        if (numClusters < numTracks || numTracks == 1) {
          word = 'process-success';
          description = `${numTracks} tracks grouped into ${numClusters} clusters`;
        } else {
          word = 'process-info';
          description = 'Each track has its own cluster';
        }
        return {word, description};
      }),
      startWith(defaultStatus),
    );
  }

  getClusteringProcess(): ProcessStream {
    // emit a new process every time the set of query genes or clustering params
    // changes
    const selectedGeneIDs = this._store.select(fromGenes.getSelectedGeneIDs);
    const clusteringParams = this._store.select(fromParams.getClusteringParams);
    return combineLatest(selectedGeneIDs, clusteringParams).pipe(
      map(([geneIDs, params]): Process => {
        return {
          subprocesses: empty(),
          status: this._getClusteringProcessStatus(),
        };
      }),
    );
  }

  private _getQueryAlignmentProcessStatus(): ProcessStatusStream {
    const defaultDescription = 'Waiting for clustering';
    const defaultStatus = this._defaultProcessStatusFactory(defaultDescription);
    return combineLatest(
      this._store.select(fromGenes.getSelectedGenesLoaded),
      this._store.select(fromChromosome.getSelectedChromosomesLoaded),
      this._store.select(fromMicroTracks.getClusteredAndAlignedSelectedMicroTracks),
    ).pipe(
      filter(([genesLoaded, chromosomesLoaded, {consensuses, tracks}]) => {
        return genesLoaded && chromosomesLoaded;
      }),
      map(([genesLoaded, chromosomesLoaded, {consensuses, tracks}]):
      ProcessStatus => {
        // TODO: implement other, non-success statuses
        return {
          word: 'process-success',
          description: 'Tracks successfully aligned',
        };
      }),
      startWith(defaultStatus),
    );
  }

  getQueryAlignmentProcess(): ProcessStream {
    // emit a new process every time the set of query genes or clustering params
    // changes (users don't control the multiple alignment params)
    const selectedGeneIDs = this._store.select(fromGenes.getSelectedGeneIDs);
    const clusteringParams = this._store.select(fromParams.getClusteringParams);
    return combineLatest(selectedGeneIDs, clusteringParams).pipe(
      map(([geneIDs, params]): Process => {
        return {
          subprocesses: empty(),
          status: this._getQueryAlignmentProcessStatus(),
        };
      }),
    );
  }

  // micro track

  private _getTrackSearchSubprocess(clusterID: number, source: string):
  ProcessStatusStream {
    const idString = partialMicroTrackID(clusterID, source);
    return combineLatest(
      this._store.select(fromMicroTracks.getLoading),
      this._store.select(fromMicroTracks.getLoaded),
      this._store.select(fromMicroTracks.getFailed),
    ).pipe(
      map(([loading, loaded, failed]) => {
        const loadingStrings = new Set(loading.map((t) => partialMicroTrackID(t)));
        if (loadingStrings.has(idString)) {
          return {
            word: 'process-running',
            description: `Searching <b>${source}</b> for similar tracks`,
          };
        }
        // TODO: say how many similar tracks were found
        const loadedStrings = new Set(loaded.map((t) => partialMicroTrackID(t)));
        if (loadedStrings.has(idString)) {
          return {
            word: 'process-success',
            description: `The <b>${source}</b> search completed`,
          };
        }
        const failedStrings = new Set(failed.map((t) => partialMicroTrackID(t)));
        if (failedStrings.has(idString)) {
          return {
            word: 'process-error',
            description: `The <b>${source}</b> search failed`,
          };
        }
        return {
          word: 'process-warning',
          description: `No status for <b>${source}</b>`,
        };
      }),
    );
  }

  private _getTrackSearchSubprocesses(clusterID: number, sources: string[]):
  Observable<ProcessStatusStream> {
    return Observable.create((observer) => {
      sources.forEach((source) => {
        const subproccess = this._getTrackSearchSubprocess(clusterID, source);
        observer.next(subproccess);
      });
      observer.complete();
    });
  }

  private _getTrackSearchProcessStatus(subprocesses: Observable<ProcessStatusStream>):
  ProcessStatusStream {
    return subprocesses.pipe(
      // aggregate subprocesses into array
      scan((accumulator, processStatus) => {
        accumulator.push(processStatus);
        return accumulator;
      }, []),
      // derive status from array
      switchMap((subs): ProcessStatusStream => {
        return combineLatest(...subs).pipe(
          map((subStates): ProcessStatus => {
            const words = new Set(subStates.map((status) => status.word));
            let word: ProcessStatusWord;
            let description: string;
            if (words.has('process-running')) {
              word = 'process-running';
              description = 'Searching for similar tracks';
            // all success
            } else if (words.has('process-success') && words.size == 1) {
              word = 'process-success';
              description = 'All searches successfully completed';
            // all error
            } else if (words.has('process-error') && words.size == 1) {
              word = 'process-error';
              description = 'All searches failed';
            // success and error
            } else {
              word = 'process-warning';
              description = 'One or more searches failed';
            }
            return {word, description};
          }),
        );
      }),
    );
  }

  getTrackSearchProcess(clusterID: number): ProcessStream {
    // emit a new process every time the micro-synteny or source params change
    return combineLatest(
      this._store.select(fromParams.getQueryParams),
      this._store.select(fromParams.getSourceParams),
    ).pipe(
      map(([queryParams, sourceParams]) => {
        const sources = sourceParams.sources;
        const subprocesses =
          this._getTrackSearchSubprocesses(clusterID, sources);
        return {
          subprocesses,
          status: this._getTrackSearchProcessStatus(subprocesses),
        };
      }),
    );
  }

  private _getTrackAlignmentProcessStatus(clusterID: number): ProcessStatusStream {
    const defaultDescription = 'Waiting for search results';
    const defaultStatus = this._defaultProcessStatusFactory(defaultDescription);
    return combineLatest(
      // TODO: should there be a "loaded" selector like there is for genes and
      // chromosomes in case searches are successful but don't return any tracks?
      this._store.select(fromMicroTracks.getActiveSearchMicroTracks),
      this._store.select(fromMicroTracks.getClusteredAndAlignedSearchMicroTracks),
    ).pipe(
      map(([tracks, alignedTracks]) => {
        const filteredTracks = tracks.filter((t) => t.cluster == clusterID);
        const filteredAlignedTracks =
          alignedTracks.filter((t) => t.cluster == clusterID);
        return [filteredTracks, filteredAlignedTracks];
      }),
      filter(([tracks, alignedTracks]) => tracks.length > 0),
      map(([tracks, alignedTracks]): ProcessStatus => {
        const numAligned = alignedTracks.length;
        const trackIDs = new Set(tracks.map((t) => microTrackID(t)));
        const alignmentIDs = new Set(alignedTracks.map((t) => microTrackID(t)));
        let word: ProcessStatusWord;
        let description: string;
        if (trackIDs.size == alignmentIDs.size) {
          word = 'process-success';
          description = `${numAligned} alignments; one or more for every track`;
        } else if (alignmentIDs.size == 0) {
          word = 'process-warning';
          description = 'No alignments met the score requirements';
        } else {
          word = 'process-info';
          description = `${numAligned} alignments; some tracks don't have alignments`;
        }
        return {word, description};
      }),
      startWith(defaultStatus),
    );
  }

  getTrackAlignmentProcess(clusterID: number): ProcessStream {
    // emit a new process every time the micro-synteny, source, or alignment
    // params change
    return combineLatest(
      this._store.select(fromParams.getQueryParams),
      this._store.select(fromParams.getSourceParams),
      this._store.select(fromParams.getAlignmentParams),
    ).pipe(
      map(([queryParams, sourceParams, alignment]) => {
        return {
          subprocesses: empty(),
          status: this._getTrackAlignmentProcessStatus(clusterID),
        };
      }),
    );
  }

  private _getTrackGeneSubprocess(clusterID: number, source: string):
  ProcessStatusStream {
    return combineLatest(
      // get all selected and search result tracks
      this._store.select(fromMicroTracks.getSelectedMicroTracks),
      this._store.select(fromMicroTracks.getActiveSearchMicroTracks),
      // get gene loading states
      this._store.select(fromGenes.getLoading),
      this._store.select(fromGenes.getLoaded),
      this._store.select(fromGenes.getFailed),
    ).pipe(
      map(([selectedTracks, searchTracks, loading, loaded, failed]) => {
        // keep tracks belonging to cluster and source and convert to gene array
        const selectedGenes: string[] = arrayFlatten(
            selectedTracks
              .filter((t) => t.cluster == clusterID && t.source == source)
              .map((t) => t.genes)
          );
        const searchGenes: string[] = arrayFlatten(
            searchTracks
              .filter((t) => t.cluster == clusterID && t.source == source)
              .map((t) => t.genes)
          );
        const genes = selectedGenes.concat(searchGenes);
        return this._genesAndLoadStateToStatus(genes, source, loading, loaded,
          failed);
      }),
    );
  }

  private _getTrackGeneSubprocesses(clusterID: number):
  Observable<ProcessStatusStream> {
    // get all selected and search result tracks
    return combineLatest(
      this._store.select(fromMicroTracks.getSelectedMicroTracks),
      this._store.select(fromMicroTracks.getActiveSearchMicroTracks),
    ).pipe(
      // keep tracks belonging to cluster and convert to source array
      map(([selectedTracks, searchTracks]) => {
        const selectedSources =
            selectedTracks
              .filter((t) => t.cluster == clusterID)
              .map((t) => t.source);
        const searchSources =
            searchTracks
              .filter((t) => t.cluster == clusterID)
              .map((t) => t.source);
        return selectedSources.concat(searchSources);
      }),
      // flatten the source array
      mergeAll(),
      // only allow one subprocess per source
      distinct(),
      // generate a subprocess for each source
      map((source: string) => this._getTrackGeneSubprocess(clusterID, source)),
    );
  }

  private _getTrackGeneProcessStatus(subprocesses: Observable<ProcessStatusStream>):
  ProcessStatusStream {
    const defaultDescription = 'Waiting for tracks';
    const defaultStatus = this._defaultProcessStatusFactory(defaultDescription);
    return subprocesses.pipe(
      // aggregate subprocesses into array
      scan((accumulator, processStatus) => {
        accumulator.push(processStatus);
        return accumulator;
      }, []),
      // derive status from array
      switchMap((subs): ProcessStatusStream => {
        return combineLatest(...subs).pipe(
          map((subStates): ProcessStatus => {
            const words = new Set(subStates.map((status) => status.word));
            let word: ProcessStatusWord;
            let description: string;
            if (words.has('process-running')) {
              word = 'process-running';
              description = 'Loading track genes';
            // all success
            } else if (words.has('process-success') && words.size == 1) {
              word = 'process-success';
              description = 'All track genes successfully loaded';
            // all error
            } else if (words.has('process-error') && words.size == 1) {
              word = 'process-error';
              description = 'Failed to load track genes';
            // success and error
            } else {
              word = 'process-warning';
              description = 'Failed to load one or more track genes';
            }
            return {word, description};
          }),
        );
      }),
      startWith(defaultStatus),
    );
  }

  getTrackGeneProcess(clusterID: number): ProcessStream {
    // emit a new process every time the micro-synteny, source, or alignment
    // params change
    return combineLatest(
      this._store.select(fromParams.getQueryParams),
      this._store.select(fromParams.getSourceParams),
      this._store.select(fromParams.getAlignmentParams),
    ).pipe(
      map(([queryParams, sourceParams, alignment]) => {
        const subprocesses = this._getTrackGeneSubprocesses(clusterID);
        return {
          subprocesses,
          status: this._getTrackGeneProcessStatus(subprocesses),
        };
      }),
    );
  }

  // macro blocks

  private _getMacroBlockSubprocess(
    chromosomes: {name: string, source: string}[],
    source: string,
    targets: string[],
  ): ProcessStatusStream {
    const targetIDs = arrayFlatten(
      chromosomes.map((c) => {
        const wildcardID = {
            referenceSource: c.source,
            reference: c.name,
            chromosomeSource: source,
          };
        if (targets.length > 0) {
          return targets.map((name) => {
            return {...wildcardID, chromosome: name};
          });
        }
        return [wildcardID];
      })
    );
    const chromosomeFilter = (idSet) => {
        return (blockID) => {
          const {chromosome, ...wildcardID} = blockID;
          return idSet.has(pairwiseBlocksID(blockID)) ||
                 idSet.has(pairwiseBlocksID(wildcardID));
        };
      };
    return combineLatest(
      // get gene loading states
      this._store.select(fromPairwiseBlocks.getLoading),
      this._store.select(fromPairwiseBlocks.getLoaded),
      this._store.select(fromPairwiseBlocks.getFailed),
    ).pipe(
      map(([loading, loaded, failed]) => {
        const loadedIDs = new Set(loaded.map(pairwiseBlocksID));
        // filter targets (and containing wildcards) by loaded
        const loadedTargets = targetIDs.filter(chromosomeFilter(loadedIDs));
        if (loadedTargets.length == targetIDs.length) {
          return {
            word: 'process-success',
            description: `Successfully loaded blocks from <b>${source}</b>`,
          };
        }
        const loadingIDs = new Set(loading.map(pairwiseBlocksID));
        const loadingTargets = targetIDs.filter(chromosomeFilter(loadingIDs));
        if (loadingTargets.length > 0) {
          return {
            word: 'process-running',
            description: `Loading blocks from <b>${source}</b>`,
          };
        }
        const failedIDs = new Set(failed.map(pairwiseBlocksID))
        const failedTargets = targetIDs.filter(chromosomeFilter(failedIDs));
        if (failedTargets.length == targetIDs.length) {
          return {
            word: 'process-error',
            description: `Failed to load blocks from <b>${source}</b>`,
          };
        }
        return {
          word: 'process-warning',
          description: `Failed to load blocks for one of more chromosomes from <b>${source}</b>`,
        };
      }),
    );
  }

  private _getMacroBlockSubprocesses(
    chromosomes: {name: string, source: string}[],
    sources: string[],
    targets: string[],
  ): Observable<ProcessStatusStream> {
    // emit a subprocess for each source
    return Observable.create((observer) => {
      sources.forEach((source) => {
        const subprocess =
          this._getMacroBlockSubprocess(chromosomes, source, targets);
        observer.next(subprocess);
      });
      observer.complete();
    });
  }

  private _getMacroBlockProcessStatus(subprocesses: Observable<ProcessStatusStream>):
  ProcessStatusStream {
    return subprocesses.pipe(
      // aggregate subprocesses into array
      scan((accumulator, processStatus) => {
        accumulator.push(processStatus);
        return accumulator;
      }, []),
      // derive status from array
      switchMap((subs): ProcessStatusStream => {
        return combineLatest(...subs).pipe(
          map((subStates): ProcessStatus => {
            const words = new Set(subStates.map((status) => status.word));
            let word: ProcessStatusWord;
            let description: string;
            if (words.has('process-running')) {
              word = 'process-running';
              description = 'Loading blocks';
            // all success
            } else if (words.has('process-success') && words.size == 1) {
              word = 'process-success';
              description = 'All blocks successfully loaded';
            // all error
            } else if (words.has('process-error') && words.size == 1) {
              word = 'process-error';
              description = 'Failed to load blocks';
            // success and error
            } else {
              word = 'process-warning';
              description = 'Failed to load blocks from one or more sources';
            }
            return {word, description};
          }),
        );
      }),
    );
  }

  getMacroBlockProcess(
    chromosomes: {name: string, source: string}[],
    targets: string[]=[],
  ): ProcessStream {
    // emit a new process every time the source or block params change
    return combineLatest(
      this._store.select(fromParams.getSourceParams),
      this._store.select(fromParams.getBlockParams),
    ).pipe(
      map(([sourceParams, blockParams]) => {
        const sources = sourceParams.sources;
        const subprocesses
          = this._getMacroBlockSubprocesses(chromosomes, sources, targets);
        return {
          subprocesses,
          status: this._getMacroBlockProcessStatus(subprocesses),
        };
      }),
    );
  }

  private _getMacroBlockPositionSubprocess(
    chromosomes: {name: string, source: string}[],
    source: string,
    targets: string[],
  ): ProcessStatusStream {
    const chromosomeIDs = new Set(arrayFlatten(
        chromosomes.map((c) => {
          const wildcardID = {
              reference: c.name,
              referenceSource: c.source,
              chromosomeSource: source,
            };
          if (targets.length > 0) {
            return targets.map((name) => {
              return pairwiseBlocksID({...wildcardID, chromosome: name});
            });
          }
          return [pairwiseBlocksID(wildcardID)];
        })
      ));
    return combineLatest(
      // get chromosomes and blocks
      this._store.select(fromChromosome.getChromosomesForIDs(chromosomes)),
      this._store.select(fromPairwiseBlocks.getPairwiseBlocks).pipe(
        map((blocks) => {
          return blocks.filter((b) => {
            const {chromosome, ...wildcard} = b;
            const id = (targets.length > 0) ?
              pairwiseBlocksID(b) :
              pairwiseBlocksID(wildcard);
            return chromosomeIDs.has(id);
          });
        }),
      ),
      // get gene loading states
      this._store.select(fromGenes.getLoading),
      this._store.select(fromGenes.getLoaded),
      this._store.select(fromGenes.getFailed),
    ).pipe(
      map(([chromosomes, pairwiseBlocks, loading, loaded, failed]) => {
        const chromosomeMap = trackMap(chromosomes);
        const genes: string[] = arrayFlatten(
            pairwiseBlocks.map((blocks) => {
              const id = trackID(blocks.reference, blocks.referenceSource);
              const genes = chromosomeMap[id].genes;
              return arrayFlatten(
                blocks.blocks.map((b) => [genes[b.i], genes[b.j]])
              );
            })
          );
        return this._genesAndLoadStateToStatus(genes, source, loading, loaded,
          failed);
      }),
    );
  }

  private _getMacroBlockPositionSubprocesses(
    chromosomes: {name: string, source: string}[],
    sources: string[],
    targets: string[],
  ): Observable<ProcessStatusStream> {
    const chromosomeIDs = new Set(arrayFlatten(
        chromosomes.map((c) => arrayFlatten(
          sources.map((s) => {
            const wildcardID = {
                referenceSource: c.source,
                reference: c.name,
                chromosomeSource: s,
              };
            if (targets.length > 0) {
              return targets.map((name) => {
                const id = {...wildcardID, chromosome: name};
                return pairwiseBlocksID(id);
              });
            }
            return [pairwiseBlocksID(wildcardID)];
          })
        ))
      ));
    // group blocks by source
    return this._store.select(fromPairwiseBlocks.getPairwiseBlocks)
    .pipe(
      // flatten arrays into single emissions
      mergeAll(),
      // only keep blocks with one of the chromosomes as the reference
      filter((blocks: PairwiseBlocks) => {
        const {chromosome, ...wildcard} = blocks;
        const id = (targets.length > 0) ?
          pairwiseBlocksID(blocks) : pairwiseBlocksID(wildcard);
        return chromosomeIDs.has(id);
      }),
      // get sources from blocks that have loaded so we don't create a process
      // for a source that genes will never be loaded from (it has no blocks)
      map((blocks) => blocks.referenceSource),
      // only let distinct sources through
      distinct(),
      // create a subprocess for each source
      map((source) => {
        const sourceChromosomes = chromosomes.filter((c) => c.source == source);
        return this._getMacroBlockPositionSubprocess(
          sourceChromosomes,
          source,
          targets,
        );
      }),
    )
  }

  private _getMacroBlockPositionStatus(
    subprocesses: Observable<ProcessStatusStream>,
  ): ProcessStatusStream {
    const defaultDescription = 'Waiting for blocks';
    const defaultStatus = this._defaultProcessStatusFactory(defaultDescription);
    return subprocesses.pipe(
      // aggregate subprocesses into array
      scan((accumulator, processStatus) => {
        accumulator.push(processStatus);
        return accumulator;
      }, []),
      // derive status from array
      switchMap((subs): ProcessStatusStream => {
        return combineLatest(...subs).pipe(
          map((subStates): ProcessStatus => {
            const words = new Set(subStates.map((status) => status.word));
            let word: ProcessStatusWord;
            let description: string;
            if (words.has('process-running')) {
              word = 'process-running';
              description = 'Loading positions';
            // all success
            } else if (words.has('process-success') && words.size == 1) {
              word = 'process-success';
              description = 'All positions successfully loaded';
            // all error
            } else if (words.has('process-error') && words.size == 1) {
              word = 'process-error';
              description = 'Failed to load positions';
            // success and error
            } else {
              word = 'process-warning';
              description = 'Failed to load positions from one or more sources';
            }
            return {word, description};
          }),
        );
      }),
      startWith(defaultStatus),
    );
  }

  getMacroBlockPositionProcess(
    chromosomes: {name: string, source: string}[],
    targets: string[]=[],
  ): ProcessStream {
    // emit a new process every time the source or block params change
    return combineLatest(
      this._store.select(fromParams.getSourceParams),
      this._store.select(fromParams.getBlockParams),
    ).pipe(
      map(([sourceParams, blocksParams]) => {
        const sources = sourceParams.sources;
        const subprocesses =
          this._getMacroBlockPositionSubprocesses(chromosomes, sources, targets);
        return {
          subprocesses,
          status: this._getMacroBlockPositionStatus(subprocesses),
        };
      }),
    );
  }

  getCircosBlockProcess(clusterID: number): ProcessStream {
    // emit a new process every time a new chromosome is emitted for the cluster
    // TODO: not ideal...
    return this._store.pipe(
      select(fromChromosome.getSelectedChromosomesForCluster(clusterID))
    ).pipe(
      switchMap((chromosomes) => {
        const IDs = chromosomes
          .map(({name, source, ...attrs}) => ({name, source}));
        const targets = chromosomes.map((id) => id.name);
        return this.getMacroBlockProcess(IDs, targets);
      }),
    );
  }


  getCircosBlockPositionProcess(clusterID: number): ProcessStream {
    // emit a new process every time a new chromosome is emitted for the cluster
    // TODO: not ideal...
    return this._store.pipe(
      select(fromChromosome.getSelectedChromosomesForCluster(clusterID))
    ).pipe(
      switchMap((chromosomes) => {
        const IDs = chromosomes
          .map(({name, source, ...attrs}) => ({name, source}));
        const targets = chromosomes.map((id) => id.name);
        return this.getMacroBlockPositionProcess(IDs, targets);
      }),
    );
  }

  // plots

  private _getPlotGeneSubprocess(source: string, genes: string[]):
  ProcessStatusStream {
    return combineLatest(
      // get gene loading states
      this._store.select(fromGenes.getLoading),
      this._store.select(fromGenes.getLoaded),
      this._store.select(fromGenes.getFailed),
    ).pipe(
      map(([loading, loaded, failed]) => {
        return this._genesAndLoadStateToStatus(genes, source, loading, loaded,
          failed);
      }),
    );
  }

  private _getPlotGeneSubprocesses(plot: Plot): Observable<ProcessStatusStream> {
    // bin plot genes by source
    const sourceGeneMap = plot.sourceGeneMap();
    // emit a subprocess for each source
    return Observable.create((observer) => {
      Object.entries(sourceGeneMap)
        .forEach(([source, genes]: [string, string[]]) => {
          const subprocess = this._getPlotGeneSubprocess(source, genes);
          observer.next(subprocess);
        });
      observer.complete();
    });
  }

  private _getPlotGeneProcessStatus(subprocesses: Observable<ProcessStatusStream>):
  ProcessStatusStream {
    return subprocesses.pipe(
      // aggregate subprocesses into array
      scan((accumulator, processStatus) => {
        accumulator.push(processStatus);
        return accumulator;
      }, []),
      // derive status from array
      switchMap((subs): ProcessStatusStream => {
        return combineLatest(...subs).pipe(
          map((subStates): ProcessStatus => {
            const words = new Set(subStates.map((status) => status.word));
            let word: ProcessStatusWord;
            let description: string;
            if (words.has('process-running')) {
              word = 'process-running';
              description = 'Loading plot genes';
            // all success
            } else if (words.has('process-success') && words.size == 1) {
              word = 'process-success';
              description = 'All plot genes successfully loaded';
            // all error
            } else if (words.has('process-error') && words.size == 1) {
              word = 'process-error';
              description = 'Failed to load plot genes';
            // success and error
            } else {
              word = 'process-warning';
              description = 'Failed to load one or more plot genes';
            }
            return {word, description};
          }),
        );
      }),
    );
  }

  getPlotGeneProcess(
    type: 'local' | 'global',
    reference: Track & ClusterMixin,
    track: Track & ClusterMixin,
  ): ProcessStream {
    // return a process every time the plots update
    const plots = type == 'local' ?
      this._store.pipe(select(fromPlots.getLocalPlots(track))) :
      this._store.pipe(select(fromPlots.getGlobalPlots(track)));
    return plots.pipe(
      // NOTE: this is awkward; see plot component
      mergeAll(),
      filter((plot: Plot) => {
        return plot.reference.name === reference.name &&
               plot.reference.source === reference.source;
      }),
      map((plot) => {
        const subprocesses = this._getPlotGeneSubprocesses(plot);
        return {
          subprocesses,
          status: this._getPlotGeneProcessStatus(subprocesses),
        };
      }),
    );
  }

}
