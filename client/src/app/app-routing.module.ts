// Angular
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

// App
import { AppRoutes } from "./constants/app-routes";
// import { DefaultQueryParams } from "./constants/default-parameters";
import { InstructionsComponent } from "./components/instructions/instructions.component";
import { MultiComponent } from "./components/multi/multi.component";
import { SearchComponent } from "./components/search/search.component";

const routes: Routes = [
  {
    path: "",
    pathMatch: "full",
    redirectTo: "/instructions",
  },
  {
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
    // redirectTo: AppRoutes.SEARCH + "/" + DefaultQueryParams.DEFAULT_SOURCE + "/:gene",
    redirectTo: "/instructions",
  },
  {
    component: SearchComponent,
    path: AppRoutes.SEARCH + "/:source/:gene",
  },
];

@NgModule({
  exports: [ RouterModule ],
  imports: [ RouterModule.forRoot(routes, {useHash: true,}) ],
})
export class AppRoutingModule { }
