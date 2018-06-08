// Angular
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
// app
import { InstructionsComponent, MultiComponent, SearchComponent } from "./components";
import { DefaultSearchGuard, MultiGuard, SearchGuard } from "./guards";

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
    canActivate: [DefaultSearchGuard],  // use guard to redirect to default server in AppConfig
    path: "search/:gene",
    pathMatch: "full",
    component: SearchComponent,
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
