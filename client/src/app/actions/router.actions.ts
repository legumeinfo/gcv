import { Action } from '@ngrx/store';
import { NavigationExtras } from '@angular/router';

export const GO = '[ROUTER] GO';
export const BACK = '[ROUTER] BACK';
export const FORWARD = '[ROUTER] FORWARD';

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

export type Actions = Go | Back | Forward;
