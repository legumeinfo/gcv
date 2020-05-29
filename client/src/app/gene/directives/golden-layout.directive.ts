// Angular
import { AfterContentInit, Directive, ElementRef, Input, OnDestroy }
  from '@angular/core';
// app
import { ComponentService } from '@gcv/gene/services';


declare var GoldenLayout: any;

 
@Directive({
  selector: '[gcvGoldenLayout]',
})
export class GoldenLayoutDirective implements AfterContentInit, OnDestroy {

  @Input('gcvGoldenLayout') components: any[];
  @Input() config: any;

  private _layout: any;

  constructor(private _componentService: ComponentService,
              private _el: ElementRef) { }

  // Angular hooks

  ngAfterContentInit() {
    this._initialize();
  }

  ngOnDestroy() {
    this._destroy();
  }

  // private

  private _initialize(): void {
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

  private _destroy(): void {
    // remove resize listener
    window.removeEventListener('resize', this._resize.bind(this));
    // destroy layout
    this._layout.destroy()
  }

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
      const name = c.name;
      this._layout.registerComponent(name, function($container, state) {
        const component = c.component;
        const element = $container.getElement();
        const inputs = state.inputs || {};
        const outputs = state.outputs || {};
        this.componentRef = context._componentService
          .createComponent(component, element, inputs, outputs);
        return this;
      });
    });
    // bind component destructor to layout's item destroy event
    this._layout.on('itemDestroyed', (item, state) => {
      if (item.type === 'component') {
        this._componentService.destroyComponent(item.instance.componentRef);
      }
    });
  }

  private _resize() {
    const width = this._el.nativeElement.offsetWidth;
    const height = this._el.nativeElement.offsetHeight;
    this._layout.updateSize(width, height);
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

  stackItem(itemConfig, stackID: string) {
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
        // handle nested stacks
        const item = contentItem.isStack ? contentItem.parent : contentItem;
        let stack = this._closestStack(item);
        if (stack !== null) {
          stack.setActiveContentItem(contentItem);
        }
      }
    }
  }

  reset() {
    this._destroy();
    this._initialize();
  }
}
