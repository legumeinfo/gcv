// Angular
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
// app
import * as fromComponents from '@gcv/core/components';
import * as fromContainers from '@gcv/core/containers';
import * as fromServices from '@gcv/core/services';


@NgModule({
  declarations: [
    ...fromContainers.components,
    ...fromComponents.components
  ],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [...fromComponents.components],
  providers: [...fromServices.services]
})
export class CoreModule { }
