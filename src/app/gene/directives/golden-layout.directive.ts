// Angular
import { AfterContentInit, ComponentRef, Directive, ElementRef, Input, OnDestroy }
  from '@angular/core';
// Golden Layout v2
import {
  ComponentContainer,
  ComponentItemConfig,
  ContentItem,
  GoldenLayout,
  ItemConfig,
  LayoutConfig,
  ResolvedLayoutConfig,
  RowOrColumn,
  Stack
} from 'golden-layout';
// app
import { ComponentService } from '@gcv/gene/services';


interface LayoutComponent {
  name: string;
  component: any;
}

interface ComponentRefMap {
  [containerId: string]: ComponentRef<any>;
}


@Directive({
    selector: '[gcvGoldenLayout]',
    standalone: false
})
export class GoldenLayoutDirective implements AfterContentInit, OnDestroy {

  @Input('gcvGoldenLayout') components: LayoutComponent[];
  @Input() config: LayoutConfig | any;

  private _layout: GoldenLayout;
  private _componentRefs: ComponentRefMap = {};
  private _resizeHandler: () => void;

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

    // instantiate the layout with bind/unbind handlers
    this._layout = new GoldenLayout(
      this._el.nativeElement,
      this._bindComponent.bind(this),
      this._unbindComponent.bind(this)
    );

    // load the layout configuration
    this._layout.loadLayout(this.config);

    // add a resize listener
    this._resizeHandler = this._resize.bind(this);
    window.addEventListener('resize', this._resizeHandler);
  }

  private _destroy(): void {
    // remove resize listener
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
    }
    // destroy all component refs
    Object.values(this._componentRefs).forEach(ref => {
      this._componentService.destroyComponent(ref);
    });
    this._componentRefs = {};
    // destroy layout
    if (this._layout) {
      this._layout.destroy();
    }
  }

  private _setConfig(): void {
    if (this.config === undefined) {
      this.config = {
        root: {
          type: 'column',
          content: this.components.map((c) => {
            return {
              type: 'component',
              componentType: c.name,
              isClosable: false
            };
          })
        }
      };
    }
  }

  private _bindComponent(
    container: ComponentContainer,
    itemConfig: ComponentItemConfig
  ): ComponentContainer.BindableComponent {
    const componentType = itemConfig.componentType as string;
    const layoutComponent = this.components.find(c => c.name === componentType);

    if (!layoutComponent) {
      console.error(`Component type "${componentType}" not found in registered components`);
      return { component: undefined, virtual: false };
    }

    const state = (itemConfig.componentState || {}) as any;
    const inputs = state.inputs || {};
    const outputs = state.outputs || {};

    // Create Angular component and append to container element
    const componentRef = this._componentService.createComponent(
      layoutComponent.component,
      container.element,
      inputs,
      outputs
    );

    // Store reference for cleanup using container's unique ID
    const containerId = this._getContainerId(container);
    this._componentRefs[containerId] = componentRef;

    return {
      component: componentRef,
      virtual: false
    };
  }

  private _unbindComponent(container: ComponentContainer): void {
    const containerId = this._getContainerId(container);
    const componentRef = this._componentRefs[containerId];

    if (componentRef) {
      this._componentService.destroyComponent(componentRef);
      delete this._componentRefs[containerId];
    }
  }

  private _getContainerId(container: ComponentContainer): string {
    // Use the container's parent component item's ID or generate a unique one
    const parent = container.parent;
    if (parent && parent.id) {
      return parent.id;
    }
    // Fallback: use object reference as string
    return String((container as any)._element?.id || Math.random());
  }

  private _resize(): void {
    if (this._layout) {
      const width = this._el.nativeElement.offsetWidth;
      const height = this._el.nativeElement.offsetHeight;
      this._layout.setSize(width, height);
    }
  }

  // finds the closest ancestor to an item that is a stack
  private _closestStack(item: ContentItem): Stack | null {
    const rootItem = this._layout.rootItem;
    let current: ContentItem | null = item;

    while (current && current !== rootItem) {
      if (current.isStack) {
        return current as Stack;
      }
      current = current.parent;
    }

    return null;
  }

  // Find items by ID - v2 uses different API
  private _findItemsById(id: string): ContentItem[] {
    const rootItem = this._layout.rootItem;
    if (!rootItem) return [];

    const results: ContentItem[] = [];
    const search = (item: ContentItem) => {
      if (item.id === id) {
        results.push(item);
      }
      if ('contentItems' in item) {
        (item as RowOrColumn | Stack).contentItems.forEach(search);
      }
    };
    search(rootItem);
    return results;
  }

  // public

  addItem(itemConfig: ComponentItemConfig, indices: number[]): void {
    const rootItem = this._layout.rootItem;
    if (!rootItem) return;

    const id = itemConfig.id;
    if (id !== undefined) {
      const instances = this._findItemsById(id);
      if (instances.length === 0) {
        // Navigate to target location using indices
        let item: ContentItem = rootItem;
        for (const i of indices) {
          if ('contentItems' in item && (item as RowOrColumn | Stack).contentItems[i]) {
            item = (item as RowOrColumn | Stack).contentItems[i];
          }
        }
        // Add child to the target item
        if ('addChild' in item) {
          (item as any).addChild(itemConfig);
        }
      } else {
        // Item already exists, activate it
        const contentItem = instances[0];
        const stack = this._closestStack(contentItem);
        if (stack !== null && contentItem.isComponent) {
          stack.setActiveComponentItem(contentItem as any, true);
        }
      }
    }
  }

  stackItem(itemConfig: ComponentItemConfig, stackID: string): void {
    const rootItem = this._layout.rootItem;
    if (!rootItem) return;

    const id = itemConfig.id;
    const items = this._findItemsById(stackID);

    if (id !== undefined && items.length > 0) {
      const instances = this._findItemsById(id);

      // find the nearest stack ancestor and add the item as a child
      if (instances.length === 0) {
        const item = items[0];
        const stack = this._closestStack(item);
        if (stack !== null) {
          (stack as any).addChild(itemConfig);
        }
      // get the item's stack and make it the active item
      } else {
        const contentItem = instances[0];
        // handle nested stacks
        const item = contentItem.isStack ? contentItem.parent : contentItem;
        if (item) {
          const stack = this._closestStack(item);
          if (stack !== null && contentItem.isComponent) {
            stack.setActiveComponentItem(contentItem as any, true);
          }
        }
      }
    }
  }

  reset(): void {
    this._destroy();
    this._initialize();
  }
}
