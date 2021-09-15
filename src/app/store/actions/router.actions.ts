import { Action } from '@ngrx/store';
import { NavigationExtras } from '@angular/router';

export const GO = '[ROUTER] GO';
export const BACK = '[ROUTER] BACK';
export const FORWARD = '[ROUTER] FORWARD';
export const CHANGE = '[ROUTER] CHANGE';

export class Go implements Action {
  readonly type = GO;
  constructor(public payload: {
    path: any[];
    query?: object;
    extras?: NavigationExtras;
  }) {}
}

export class Back implements Action {
  readonly type = BACK;
}

export class Forward implements Action {
  readonly type = FORWARD;
}

export class Change implements Action {
  readonly type = CHANGE;
  constructor(public payload: { params: any, path: string }) {}
}

export type Actions = Go | Back | Forward | Change;
