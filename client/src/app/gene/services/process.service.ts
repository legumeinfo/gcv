// Angular
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
// store
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import * as layoutActions from '@gcv/gene/store/actions/layout.actions';
import * as fromRoot from '@gcv/store/reducers';
import * as fromLayout from '@gcv/gene/store/selectors/layout';
// app
import { ProcessStream } from '@gcv/gene/models';


@Injectable()
export class ProcessService {

  constructor(private _store: Store<fromRoot.State>) { }

  private _statusFactory() {
    return Observable.create((observer) => {
      const status = {
          word: 'process-success',
          description: 'The process is processing',
        };
      observer.next(status);
      //observer.complete();
    });
  }

  private _subprocessFactory() {
    return Observable.create((observer) => {
      const sub1 = this._statusFactory();
      const sub2 = this._statusFactory();
      observer.next(sub1);
      observer.next(sub2);
      //observer.complete();
    });
  }

  private _processFactory() {
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

  getQueryGeneProcess(): ProcessStream {
    return this._processFactory();
  }

  getQueryTrackProcess(): ProcessStream {
    return this._processFactory();
  }

  getClusteringProcess(): ProcessStream {
    return this._processFactory();
  }

  getQueryAlignmentProcess(): ProcessStream {
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
