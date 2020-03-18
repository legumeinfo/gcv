// Angular
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { map, scan, switchMap } from 'rxjs/operators';
// store
import { Store } from '@ngrx/store';
import { GeneID, geneID } from '@gcv/gene/store/reducers/gene.reducer';
import * as layoutActions from '@gcv/gene/store/actions/layout.actions';
import * as fromRoot from '@gcv/store/reducers';
import * as fromGenes from '@gcv/gene/store/selectors/gene';
import * as fromLayout from '@gcv/gene/store/selectors/layout';
// app
import { Process, ProcessStatus, ProcessStatusStream, ProcessStatusWord,
  ProcessStream } from '@gcv/gene/models';


@Injectable()
export class ProcessService {

  constructor(private _store: Store<fromRoot.State>) { }

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
            word: 'processing',
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
            if (words.has('processing')) {
              word = 'processing';
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
    const selectedGeneIDs = this._store.select(fromGenes.getSelectedGeneIDs);
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

  getQueryTrackProcess(): ProcessStream {
    // get query track chromosome ids
    // get [query] chromosomes status from chromosome reducer
    return this._processFactory();
  }

  getClusteringProcess(): ProcessStream {
    // get selected genes and selected chromosomes loaded
    // get clustered micro tracks
    return this._processFactory();
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
