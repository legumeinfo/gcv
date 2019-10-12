// Angular
import { AfterContentInit, ApplicationRef, ComponentFactoryResolver,
  ComponentRef, Directive, ElementRef, EmbeddedViewRef, Injector, Input,
  OnDestroy } from '@angular/core';
// dependencies
//import * as GoldenLayout from 'golden-layout';

declare var GoldenLayout: any;
 
@Directive({
  selector: '[gcvGoldenLayout]',
})
export class GoldenLayoutDirective implements AfterContentInit, OnDestroy {

  @Input('gcvGoldenLayout') components: any[];
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
    this._setConfig();
    // instantiate the layout
    this._layout = new GoldenLayout(this.config, this._el.nativeElement);
    // configure the layout components
    this._configureLayoutComponents();
    // initialize the layout
    this._layout.init();
    // add a resize listener
    window.addEventListener('resize', this._resize.bind(this));
  }

  ngOnDestroy() {
    // remove resize listener
    window.removeEventListener('resize', this._resize.bind(this));
  }

  // private

  private _setConfig() {
    if (this.config === undefined) {
      this.config = {
        content: [{
          type: 'column',
          content: this.components.map((c) => {
            return {
              type: 'component',
              componentName: c.name,
              isClosable: false
            };
          })
        }]
      };
    }
  }

  private _configureLayoutComponents() {
    // register component factories
    this.components.forEach((c) => {
      let context = this;
      this._layout.registerComponent(c.name, function($container, state) {
        const inputs = state.inputs || {};
        const outputs = state.outputs || {};
        this.componentRef =
          context._createComponent(c.component, $container, inputs, outputs);
        return this;
      });
    });
    // bind component destructor to layout's item destroy event
    this._layout.on('itemDestroyed', (item, state) => {
      if (item.type === 'component') {
        this._destroyComponent(item.instance.componentRef);
      }
    });
  }

  private _resize() {
    const width = this._el.nativeElement.offsetWidth;
    const height = this._el.nativeElement.offsetHeight;
    this._layout.updateSize(width, height);
  }

  private _createComponent(component, $container, inputs, outputs):
  ComponentRef<any> {
    const factory = this._componentFactoryResolver
      .resolveComponentFactory(component);
    //const providers = Object.keys(inputs).map((i) => {
    //    return {provide: i, useValue: inputs[i]};
    //  });
    //const injector = Injector.create({providers});
    const componentRef = factory.create(this._injector);
    Object.keys(inputs).forEach((i) => componentRef.instance[i] = inputs[i]);
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

  // finds the closest ancestor to an item that is a stack
  private _closestStack(item) {
    const root = this._layout.root;
    let stack = item;
    while (stack != root && !stack.isStack) {
      stack = stack.parent;
    }
    if (stack.isStack) {
      return stack;
    }
    return null
  }

  // public

  addItem(itemConfig, indices: number[]) {
    let item = this._layout.root;
    const id = itemConfig.id;
    if (id !== undefined) {
      const instances = item.getItemsById(id);
      if (instances.length === 0) {
        indices.forEach((i) => item = item.contentItems[i]);
        item.addChild(itemConfig);
      } else {
        const contentItem = instances[0];
        const stack = this._closestStack(contentItem);
        if (stack !== null) {
          item.setActiveContentItem(contentItem);
        }
      }
    }
  }

  stackItem(itemConfig, stackID: number) {
    let root = this._layout.root;
    const id = itemConfig.id;
    const items = root.getItemsById(stackID);
    if (id !== undefined && items.length > 0) {
      const instances = root.getItemsById(id);
      // find the nearest stack ancestor and add the item as a child
      if (instances.length === 0) {
        const item = items[0];
        let stack = this._closestStack(item);
        if (stack !== null) {
          stack.addChild(itemConfig);
        }
      // get the item's stack and make it the active item
      } else {
        const contentItem = instances[0];
        let stack = this._closestStack(contentItem);
        if (stack !== null) {
          stack.setActiveContentItem(contentItem);
        }
      }
    }
  }

  reset() {
    const config = this._layout.toConfig()
    config.content = this.config.content;
    this._layout.destroy()
    this._layout.config = config;
    this._layout.init()
  }
}
