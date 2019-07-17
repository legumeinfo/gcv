// Angular
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
// app
import { InstructionsComponent, MultiComponent, GeneComponent,
  SearchComponent } from "./components";

export enum Paths {
  gene = "gene/:source/:gene",
  multi = "multi/:genes",
}

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
    path: "gene/:gene",
    pathMatch: "full",
    component: SearchComponent,
  },
  {
    component: GeneComponent,
    path: Paths.gene,
  },
  {
    component: SearchComponent,
    path: "gene/:source/:chromosome/:span",
  },
  {
    component: MultiComponent,
    path: Paths.multi,
  },
  // legacy
  {
    path: "search/:gene",
    pathMatch: "full",
    redirectTo: "gene/:gene",
  },
  {
    path: "search/:source/:gene",
    pathMatch: "full",
    redirectTo: "gene/:source/:gene",
  },
  {
    path: "search/:source/:chromosome/:span",
    pathMatch: "full",
    redirectTo: "gene/:source/:chromosome/:span",
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
