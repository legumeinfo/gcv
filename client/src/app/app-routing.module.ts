// Angular
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
// app
import { InstructionsComponent, MultiComponent, ReferenceComponent, SearchComponent } from "./components";
import { DefaultSearchGuard, MultiGuard, SearchGuard, SpanSearchGuard } from "./guards";

const routes: Routes = [
  {
    path: "",
    pathMatch: "full",
    redirectTo: "/instructions",
  },
  {
    component: InstructionsComponent,
    path: "instructions",
  },
  {
    canActivate: [DefaultSearchGuard],  // use guard to redirect to default server in AppConfig
    path: "reference/:gene",
    pathMatch: "full",
    component: SearchComponent,
  },
  {
    canActivate: [SearchGuard],
    canDeactivate: [SearchGuard],
    component: ReferenceComponent,
    path: "reference/:source/:gene",
  },
  {
    canActivate: [SpanSearchGuard],
    component: SearchComponent,
    path: "reference/:source/:chromosome/:span",
  },
  {
    canActivate: [MultiGuard],
    canDeactivate: [MultiGuard],
    component: MultiComponent,
    path: "multi/:genes",
  },
  // legacy
  {
    path: "search/:gene",
    pathMatch: "full",
    redirectTo: "reference/:gene",
  },
  {
    path: "search/:source/:gene",
    pathMatch: "full",
    redirectTo: "reference/:source/:gene",
  },
  {
    path: "search/:source/:chromosome/:span",
    pathMatch: "full",
    redirectTo: "reference/:source/:chromosome/:span",
  },
  {
    path: "basic/:genes",
    pathMatch: "full",
    redirectTo: "multi/:genes",
  },
];

@NgModule({
  exports: [ RouterModule ],
  imports: [ RouterModule.forRoot(routes) ],
})
export class AppRoutingModule { }
