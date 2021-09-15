import { Observable } from 'rxjs';


export type ProcessStatusWord = 'process-waiting' | 'process-running' | 'process-success' | 'process-error' | 'process-warning' | 'process-info';


export type ProcessStatus = {
  word: ProcessStatusWord,
  description: string,
};


export type ProcessStatusStream = Observable<ProcessStatus>;


export type Process = {
  status: ProcessStatusStream,
  // an Observable so new subprocesses can be added as the process executes
  subprocesses: Observable<ProcessStatusStream>,
};


// emits every time a Process (re)starts
export type ProcessStream = Observable<Process>;


// an ordered (by name chronology; see ES2015) collection of named
// ProcessStreams
export type Pipeline = {[name: string]: ProcessStream}
