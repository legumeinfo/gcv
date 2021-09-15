// Angular
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
// NgRx
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
// components
import * as fromComponents from './components';
import * as fromDetails from './components/details';
import * as fromTooltips from './components/tooltips';
import * as fromViewers from './components/viewers';
// directives
import * as fromDirectives from './directives';
// services
import * as fromServices from './services';
// store
import * as fromGene from './store';
// app
import { GeneRoutingModule } from '@gcv/gene/gene-routing.module';


@NgModule({
  declarations: [
    ...fromComponents.components,
    ...fromDirectives.directives
  ],
  entryComponents: [
    ...fromDetails.components,
    ...fromTooltips.components,
    ...fromViewers.components,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    StoreModule.forFeature(fromGene.geneFeatureKey, fromGene.reducers),
    EffectsModule.forFeature(fromGene.effects),
    GeneRoutingModule
  ],
  providers: [
    ...fromServices.services,
  ]
})
export class GeneModule { }
