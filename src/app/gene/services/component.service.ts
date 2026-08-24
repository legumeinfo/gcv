// Angular
import { ApplicationRef, ComponentRef, createComponent, EmbeddedViewRef, Injectable, Injector, NgZone, inject } from '@angular/core';
// store
// app


@Injectable()
export class ComponentService {
  private _appRef = inject(ApplicationRef);
  private _injector = inject(Injector);
  private _zone = inject(NgZone);


  createComponent(component, element, inputs, outputs): ComponentRef<any> {
    // v22 removed ComponentFactoryResolver; createComponent takes the class
    // directly, with the ApplicationRef's EnvironmentInjector and the root
    // element injector (preserving the previous factory.create(injector)).
    const componentRef = createComponent(component, {
      environmentInjector: this._appRef.injector,
      elementInjector: this._injector,
    });
    Object.keys(inputs).forEach((i) => componentRef.instance[i] = inputs[i]);
    Object.keys(outputs).forEach((o) => {
      componentRef.instance[o].subscribe((...args) => {
        this._zone.run(() => outputs[o](...args));
      });
    });
    this._appRef.attachView(componentRef.hostView);
    const domElem = (componentRef.hostView as EmbeddedViewRef<any>)
      .rootNodes[0] as HTMLElement;
    element.append(domElem);
    return componentRef;
  }

  destroyComponent(componentRef): void {
    this._appRef.detachView(componentRef.hostView);
    componentRef.destroy();
  }

}
