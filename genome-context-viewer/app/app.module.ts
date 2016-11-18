import './rxjs-extensions';
import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule }   from '@angular/forms';
import { HttpModule }    from '@angular/http';

import { AppRoutingModule } from './app-routing.module';

// Imports for loading & configuring the in-memory web api
//import { InMemoryWebApiModule } from 'angular-in-memory-web-api';
//import { InMemoryDataService }  from './in-memory-data.service';

import { AppComponent }          from './app.component';
import { BasicComponent }        from './components/basic/basic.component';
import { BasicParamsComponent }  from './components/basic/basic-params.component';
import { FamilyDetailComponent } from './shared/family-detail.component';
import { FilterComponent }       from './shared/filter.component';
import { GeneDetailComponent }   from './shared/gene-detail.component';
import { InstructionsComponent } from './components/instructions/instructions.component';
import { LeftSliderComponent }   from './shared/left-slider.component';
import { LegendComponent }       from './shared/legend.component';
import { MicroViewerComponent }  from './shared/micro-viewer.component';
import { NavComponent }          from './shared/nav.component';
import { PlotComponent }         from './shared/plot.component';
import { SearchComponent }       from './components/search/search.component';
import { SearchParamsComponent } from './components/search/search-params.component';
import { TrackDetailComponent }  from './shared/track-detail.component';

import { TracksService } from './shared/tracks.service';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    //InMemoryWebApiModule.forRoot(InMemoryDataService),
    AppRoutingModule
  ],
  declarations: [
    AppComponent,
    BasicComponent,
    BasicParamsComponent,
    FamilyDetailComponent,
    FilterComponent,
    GeneDetailComponent,
    InstructionsComponent,
    LeftSliderComponent,
    LegendComponent,
    MicroViewerComponent,
    NavComponent,
    PlotComponent,
    SearchComponent,
    SearchParamsComponent,
    TrackDetailComponent
  ],
  providers: [ TracksService ],
  bootstrap: [ AppComponent ],
})

export class AppModule { }
