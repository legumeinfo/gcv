// Angular
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanDeactivate,
  RouterStateSnapshot} from '@angular/router';
// app
import { SearchComponent } from "../components";

@Injectable()
export class SearchGuard implements CanActivate, CanDeactivate<SearchComponent> {

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return true;
  }

  canDeactivate(
    component: SearchComponent,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState: RouterStateSnapshot
  ): boolean {
    return true;
  }
}
