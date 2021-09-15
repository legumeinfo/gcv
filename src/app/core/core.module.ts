// Angular
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
// app
import * as fromComponents from '@gcv/core/components';
import * as fromContainers from '@gcv/core/containers';
import * as fromGuards from '@gcv/core/guards';
import * as fromServices from '@gcv/core/services';
import { WidgetsModule } from '@gcv/widgets/widgets.module';


@NgModule({
  declarations: [
    ...fromContainers.components,
    ...fromComponents.components
  ],
  imports: [
    CommonModule,
    RouterModule,
    WidgetsModule,
  ],
  exports: [...fromComponents.components],
  providers: [
    ...fromGuards.guards,
    ...fromServices.services,
  ]
})
export class CoreModule { }
