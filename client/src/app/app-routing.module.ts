// Angular
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
// app
import { InstructionsComponent, MultiComponent, SearchComponent } from "./components";
import { MultiGuard } from "./guards/multi.guard";
import { SearchGuard } from "./guards/search.guard";

const routes: Routes = [
  {
    path: "",
    pathMatch: "full",
    redirectTo: "/instructions",
  },
  {
    canActivate: [MultiGuard],
    canDeactivate: [MultiGuard],
    component: MultiComponent,
    path: "multi/:genes",
  },
  {
    path: "basic/:genes",
    pathMatch: "full",
    redirectTo: "multi/:genes",
  },
  {
    component: InstructionsComponent,
    path: "instructions",
  },
  {
    path: "search/:gene",
    pathMatch: "full",
    // TODO: update to use first source from config
    // redirectTo: "search/" + DefaultQueryParams.DEFAULT_SOURCE + "/:gene",
    redirectTo: "/instructions",
  },
  {
    canActivate: [SearchGuard],
    canDeactivate: [SearchGuard],
    component: SearchComponent,
    path: "search/:source/:gene",
  },
];

@NgModule({
  exports: [ RouterModule ],
  imports: [ RouterModule.forRoot(routes) ],
})
export class AppRoutingModule { }
