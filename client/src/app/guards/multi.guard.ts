import { Injectable } from '@angular/core';
import { CanActivate, CanDeactivate } from '@angular/router';
import { MultiComponent } from "../components/multi/multi.component";

@Injectable()
export class MultiGuard implements CanActivate, CanDeactivate<MultiComponent> {

  constructor() { }

  canActivate(): boolean {
    return true;
  }

  canDeactivate(): boolean {
    return true;
  }
}
