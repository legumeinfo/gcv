// Angular
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
// App
import { InstructionsComponent } from '@gcv/instructions/components';

export const routes: Routes = [
  {
    path: '',
    component: InstructionsComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InstructionsRoutingModule {}
