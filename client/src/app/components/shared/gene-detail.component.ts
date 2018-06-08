// Angular
import { Component, ComponentFactory, ComponentFactoryResolver, ComponentRef,
  Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewContainerRef, ViewChild } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
// App
import { AlertComponent } from "./alert.component";
import { AppConfig } from "../../app.config";
import { Alert, Gene, Server } from "../../models";
import { DetailsService } from "../../services";

@Component({
  selector: "gene-detail",
  styles: [`
    #alerts {
      position: absolute;
      left: 0;
      right: 0;
    }
  `],
  template: `
    <div id="alerts">
      <ng-container #alerts></ng-container>
    </div>
    <h4>{{gene.name}}</h4>
    <p *ngIf="familyTreeLink !== undefined">Family: <a href="{{familyTreeLink}}">{{gene.family}}</a></p>
    <p><a [routerLink]="['/search', gene.source, gene.name]" queryParamsHandling="merge">Search for similar contexts</a></p>
    <ul>
      <li *ngFor="let link of links">
        <a href="{{link.href}}">{{link.text}}</a>
      </li>
    </ul>
  `,
})

export class GeneDetailComponent implements OnChanges, OnDestroy, OnInit {
  @Input() gene: Gene;

  @ViewChild("alerts", {read: ViewContainerRef}) alerts: ViewContainerRef;

  links: any[];
  familyTreeLink: string;

  private _serverIDs = AppConfig.SERVERS.map(s => s.id);

  // emits when the component is destroyed
  private destroy: Subject<boolean>;

  constructor(
    private resolver: ComponentFactoryResolver,
    private detailsService: DetailsService
  ) {
    this.destroy = new Subject();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.links = undefined;
    if (this.gene !== undefined) {
      this.links = undefined;

      this.familyTreeLink = undefined;
      const idx = this._serverIDs.indexOf(this.gene.source);
      if (idx !== -1) {
        const s: Server = AppConfig.SERVERS[idx];
        if (s.hasOwnProperty("familyTreeLink")) {
          this.familyTreeLink = s.familyTreeLink.url + this.gene.family;
        }
      }

      this.detailsService.getGeneDetails(this.gene, (links) => {
        this.links = links;
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy.next(true);
    this.destroy.complete();
  }

  ngOnInit(): void {
    this.detailsService.requests
      .pipe(takeUntil(this.destroy))
      .subscribe(([args, request]) => {
        this._requestToAlertComponent(args.serverID, request, "links", this.alerts);
      });
  }

  private _requestToAlertComponent(serverID, request, what, container) {
    const source = AppConfig.getServer(serverID).name;
    const factory: ComponentFactory<AlertComponent> = this.resolver.resolveComponentFactory(AlertComponent);
    const componentRef: ComponentRef<AlertComponent> = container.createComponent(factory);
    // EVIL: Angular doesn't have a defined method for hooking dynamic components into
    // the Angular lifecycle so we must explicitly call ngOnChanges whenever a change
    // occurs. Even worse, there is no hook for the Output directive, so we must
    // shoehorn the desired functionality in!
    componentRef.instance.close = function(componentRef) {
      componentRef.destroy();
    }.bind(this, componentRef);
    componentRef.instance.float = true;
    componentRef.instance.alert = new Alert(
      "info",
      "Loading " + what + " from \"" + source + "\"",
      {spinner: true},
    );
    componentRef.instance.ngOnChanges({});
    request
      .pipe(takeUntil(componentRef.instance.onClose))
      .subscribe(
        (response) => {
          componentRef.instance.alert = new Alert(
            "success",
            "Successfully loaded " + what + " from \"" + source + "\"",
            {closable: true, autoClose: 3},
          );
          componentRef.instance.ngOnChanges({});
        },
        (error) => {
          componentRef.instance.alert = new Alert(
            "danger",
            "Failed to load " + what + " from \"" + source + "\"",
            {closable: true},
          );
          componentRef.instance.ngOnChanges({});
        });
  }
}
