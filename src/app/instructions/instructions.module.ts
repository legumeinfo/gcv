// Angular
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// App
import * as fromComponents from '@gcv/instructions/components';
import * as fromDirectives from '@gcv/instructions/directives';
import { CoreModule } from '@gcv/core/core.module';
import { InstructionsRoutingModule }
  from '@gcv/instructions/instructions-routing.module';
import { WidgetsModule } from '@gcv/widgets/widgets.module';


@NgModule({
  declarations: [
    ...fromComponents.components,
    ...fromDirectives.directives,
  ],
  imports: [
    CommonModule,
    InstructionsRoutingModule,
    WidgetsModule,
  ]
})
export class InstructionsModule { }
