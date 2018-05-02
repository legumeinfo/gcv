// Angular
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
// app
import { InstructionsComponent } from "./components/instructions/instructions.component";
import { MultiComponent } from "./components/multi/multi.component";
import { SearchComponent } from "./components/search/search.component";
import { AppRoutes } from "./constants/app-routes";
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
    path: AppRoutes.MULTI + "/:genes",
  },
  {
    path: "basic/:genes",
    pathMatch: "full",
    redirectTo: AppRoutes.MULTI + "/:genes",
  },
  {
    component: InstructionsComponent,
    path: "instructions",
  },
  {
    path: AppRoutes.SEARCH + "/:gene",
    pathMatch: "full",
    // TODO: update to use first source from config
    // redirectTo: AppRoutes.SEARCH + "/" + DefaultQueryParams.DEFAULT_SOURCE + "/:gene",
    redirectTo: "/instructions",
  },
  {
    canActivate: [SearchGuard],
    canDeactivate: [SearchGuard],
    component: SearchComponent,
    path: AppRoutes.SEARCH + "/:source/:gene",
  },
];

@NgModule({
  exports: [ RouterModule ],
  imports: [ RouterModule.forRoot(routes, {useHash: true}) ],
})
export class AppRoutingModule { }
