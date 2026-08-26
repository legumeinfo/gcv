import { createAction, union } from '@ngrx/store';
import { NavigationExtras } from '@angular/router';

export const GO = '[ROUTER] GO';
export const BACK = '[ROUTER] BACK';
export const FORWARD = '[ROUTER] FORWARD';
export const CHANGE = '[ROUTER] CHANGE';

export const go = createAction(
  GO,
  (payload: { path: any[]; query?: object; extras?: NavigationExtras }) => ({
    payload,
  }),
);

export const back = createAction(BACK);

export const forward = createAction(FORWARD);

export const change = createAction(
  CHANGE,
  (payload: { params: any; path: string }) => ({ payload }),
);

const _all = union({ go, back, forward, change });
export type Actions = typeof _all;
