// Angular
import { AfterContentInit, ApplicationRef, ComponentFactoryResolver,
  ComponentRef, Directive, ElementRef, EmbeddedViewRef, Injector, Input,
  OnDestroy } from "@angular/core";
// dependencies
//import * as GoldenLayout from "golden-layout";

import { MicroComponent } from "../components/gene/micro.component";

declare var GoldenLayout: any;
 
@Directive({
  selector: "[gcvGoldenLayout]",
})
export class GoldenLayoutDirective implements AfterContentInit, OnDestroy {

  @Input("gcvGoldenLayout") components: any[];
  @Input() config: any;

  private _layout: any;

  constructor(
    private _appRef: ApplicationRef,
    private _componentFactoryResolver: ComponentFactoryResolver,
    private _el: ElementRef,
    private _injector: Injector) { }

  // Angular hooks

  ngAfterContentInit() {
    // set the initial layout configuration
    if (this.config === undefined) {
      this.config = {
        content: [{
          type: "column",
          content: this.components.map((c) => {
            return {
              type: "component",
              componentName: c.name,
              isClosable: false
            };
          })
        }]
      };
    }
    
    // instantiate the layout
    this._layout = new GoldenLayout(this.config, this._el.nativeElement);

    // register component factories
    this.components.forEach((c) => {
      let context = this;
      this._layout.registerComponent(c.name, function($container, state) {
        const inputs = state.inputs || {};
        const outputs = state.outputs || {};
        this.componentRef = context._createComponent(c.component, $container, inputs, outputs);
        return this;
      });
    });

    // bind component destructor to layout's item destroy event
    this._layout.on("itemDestroyed", (item, state) => {
      if (item.type === "component") {
        this._destroyComponent(item.instance.componentRef);
      }
    });
    
    // initialize the layout
    this._layout.init();

    // add a resize listener
    window.addEventListener("resize", this._resize.bind(this));
  }

  ngOnDestroy() {
    // remove resize listener
    window.removeEventListener("resize", this._resize.bind(this));
  }

  // private

  private _resize() {
    const width = this._el.nativeElement.offsetWidth;
    const height = this._el.nativeElement.offsetHeight;
    this._layout.updateSize(width, height);
  }

  private _createComponent(component, $container, inputs, outputs): ComponentRef<any> {
    const factory = this._componentFactoryResolver
      .resolveComponentFactory(component);
    //const providers = Object.keys(inputs).map((i) => {
    //    return {provide: i, useValue: inputs[i]};
    //  });
    //const injector = Injector.create({providers});
    const componentRef = factory.create(this._injector);
    Object.keys(inputs).forEach((i) => {
      componentRef.instance[i] = inputs[i];
    });
    Object.keys(outputs).forEach((o) => {
      componentRef.instance[o].subscribe(outputs[o]);
    });
    this._appRef.attachView(componentRef.hostView);
    const domElem = (componentRef.hostView as EmbeddedViewRef<any>)
      .rootNodes[0] as HTMLElement;
    $container.getElement().append(domElem);
    return componentRef;
  }

  private _destroyComponent(componentRef) {
    this._appRef.detachView(componentRef.hostView);
    componentRef.destroy();
  }

  // public

  addItem(itemConfig) {
    this._layout.root.contentItems[0].addChild(itemConfig);
  }
}
