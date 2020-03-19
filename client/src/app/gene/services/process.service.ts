// Angular
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, combineLatest, empty, merge } from 'rxjs';
import { distinct, filter, map, mergeAll, scan, startWith, switchMap }
  from 'rxjs/operators';
// store
import { Store } from '@ngrx/store';
import { GeneID, geneID } from '@gcv/gene/store/reducers/gene.reducer';
import * as layoutActions from '@gcv/gene/store/actions/layout.actions';
import * as fromRoot from '@gcv/store/reducers';
import * as fromChromosome from '@gcv/gene/store/selectors/chromosome';
import * as fromGenes from '@gcv/gene/store/selectors/gene';
import * as fromLayout from '@gcv/gene/store/selectors/layout';
import * as fromMicroTracks from '@gcv/gene/store/selectors/micro-tracks';
import * as fromParams from '@gcv/gene/store/selectors/params';
// app
import { Process, ProcessStatus, ProcessStatusStream, ProcessStatusWord,
  ProcessStream } from '@gcv/gene/models';
import { TrackID, trackID } from '@gcv/gene/store/utils';


@Injectable()
export class ProcessService {

  constructor(private _store: Store<fromRoot.State>) { }

  private _defaultProcessStatusFactory(description): ProcessStatus {
    return {
      word: 'process-waiting',
      description,
    };
  }

  private _statusFactory(): ProcessStatusStream {
    return Observable.create((observer) => {
      const status = {
          word: 'process-success',
          description: 'The process is processing',
        };
      observer.next(status);
      //observer.complete();
    });
  }

  private _subprocessFactory(): Observable<ProcessStatusStream> {
    return Observable.create((observer) => {
      const sub1 = this._statusFactory();
      const sub2 = this._statusFactory();
      observer.next(sub1);
      observer.next(sub2);
      //observer.complete();
    });
  }

  private _processFactory(): ProcessStream {
    return Observable.create((observer) => {
      const process = {
          status: this._statusFactory(),
          subprocesses: this._subprocessFactory(),
        };
      observer.next(process);
      //observer.complete();
    });
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
        if (numClusters < numTracks) {
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

  getQueryAlignmentProcess(): ProcessStream {
    // get clustered micro tracks
    // get clustered and aligned micro tracks
    return this._processFactory();
  }

  // micro track

  getTrackSearchProcess(clusterID: number): ProcessStream {
    return this._processFactory();
  }

  getTrackAlignmentProcess(clusterID: number): ProcessStream {
    return this._processFactory();
  }

  getTrackGeneProcess(clusterID: number): ProcessStream {
    return this._processFactory();
  }

  // macro blocks

  getMacroBlockProcess(
    clusterID: number,
    chromosomes: {name: string, source: string}[]=[]):
  ProcessStream {
    return this._processFactory();
  }

  getMacroBlockPositionProcess(
    clusterID: number,
    chromosomes: {name: string, source: string}[]=[]):
  ProcessStream {
    return this._processFactory();
  }

  // plots

  getPlotGeneProcess(type, reference, track): ProcessStream {
    return this._processFactory();
  }

}
