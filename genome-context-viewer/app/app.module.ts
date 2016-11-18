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
import { InstructionsComponent } from './components/instructions/instructions.component';
import { SearchComponent }       from './components/search/search.component';
import { TracksService }         from './shared/tracks.service';
//import { DashboardComponent }  from './dashboard.component';
//import { HeroDetailComponent } from './hero-detail.component';
//import { HeroesComponent }     from './heroes.component';
//import { HeroSearchComponent } from './hero-search.component';
//import { HeroService }         from './hero.service';

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
    InstructionsComponent,
    SearchComponent
    //DashboardComponent,
    //HeroDetailComponent,
    //HeroesComponent,
    //HeroSearchComponent
  ],
  providers: [ TracksService ],
  bootstrap: [ AppComponent ],
})

export class AppModule { }
