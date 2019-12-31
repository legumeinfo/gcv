// Angular
import { Directive, ElementRef, Input } from '@angular/core';
// app
import { ComponentService } from '@gcv/gene/services';
// dependencies
import tippy, { sticky } from 'tippy.js';


@Directive({
  selector: '[gcvTooltipFactory]',
})
export class TooltipFactoryDirective {

  private _components: any = {};
  @Input('gcvTooltipFactory')
  set components(components: {component: any, name: string}[]) {
    const reducer = (accumulator, {name, component}) => {
        accumulator[name] = component;
        return accumulator;
      };
    this._components = components.reduce(reducer, {});
  }

  constructor(private _componentService: ComponentService,
              private _el: ElementRef) { }

  // private

  private _getComponent(name: string): any {
    if (name in this._components) {
      return this._components[name];
    }
    return null;
  }

  private _createComponentTip(target, component, inputs, outputs, options,
  hideOutputs): void {
    // create component
    const componentRef = this._componentService
      .createComponent(component, this._el.nativeElement, inputs, outputs);
    // create tooltip
    let _options = {
        appendTo: document.body,
        content: componentRef.location.nativeElement,
        showOnCreate: true,
        theme: 'light',
        onDestroy: (instance) => {
          this._componentService.destroyComponent(componentRef);
        },
        // TODO: figure out how to destroy only when target is removed from DOM
        onHidden: (instance) => {
          instance.destroy();
        },
        plugins: [sticky],
      };
    _options = Object.assign(_options, options);
    const tip: any = tippy(target, _options);
    // hide the tooltip when component outputs emit
    hideOutputs.forEach((o) => {
      if (o in componentRef.instance) {
        const eventEmitter = componentRef.instance[o];
        eventEmitter.subscribe((...args) => tip.hide());
      }
    });
  }

  private _destroyComponentTip(componentRef) {
    this._componentService.destroyComponent(componentRef);
  }

  // public

  componentTip(target, config: any={}): void {
    if (target._tippy === undefined) {
      const component = this._getComponent(config.componentName);
      const state = config.componentState || {};
      const inputs = state.inputs || {};
      const outputs = state.outputs || {};
      const options = config.tipOptions || {};
      const hideOutputs = config.hideOutputs || [];
      this._createComponentTip(target, component, inputs, outputs, options,
        hideOutputs);
    }
  }

}
