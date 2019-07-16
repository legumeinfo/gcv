// Angular
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanDeactivate,
  RouterStateSnapshot } from '@angular/router';
// app
import { MultiComponent } from "../components";

@Injectable()
export class MultiGuard implements CanActivate, CanDeactivate<MultiComponent> {

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return true;
  }

  canDeactivate(
    component: MultiComponent,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState: RouterStateSnapshot
  ): boolean {
    return true;
  }
}
