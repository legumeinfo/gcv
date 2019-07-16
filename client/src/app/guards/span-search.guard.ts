// Angular
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot }
  from '@angular/router';

@Injectable()
export class SpanSearchGuard implements CanActivate {

  // this guard is only triggered when no server is provided, which Search
  // needs, so instead of activating it always redirects to the default server
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):
  boolean {
    return true;
  }
}
