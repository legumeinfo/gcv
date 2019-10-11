// Angular
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// App
import * as fromComponents from '@gcv/instructions/components';
import { CoreModule } from '@gcv/core/core.module';
import { InstructionsRoutingModule }
  from '@gcv/instructions/instructions-routing.module';


@NgModule({
  declarations: [...fromComponents.components],
  imports: [
    CommonModule,
    CoreModule,
    InstructionsRoutingModule
  ]
})
export class InstructionsModule { }
