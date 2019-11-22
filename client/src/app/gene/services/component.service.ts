// Angular
import { ApplicationRef, ComponentFactoryResolver, ComponentRef,
  EmbeddedViewRef, Injectable, Injector } from '@angular/core';
// store
import { Store } from '@ngrx/store';
import * as layoutActions from '@gcv/gene/store/actions/layout.actions';
import * as fromRoot from '@gcv/gene/store/reducers';
import * as fromLayout from '@gcv/gene/store/selectors/layout';
// app
import { HttpService } from '@gcv/core/services/http.service';


@Injectable()
export class ComponentService {

  constructor(private _appRef: ApplicationRef,
              private _componentFactoryResolver: ComponentFactoryResolver,
              private _injector: Injector) { }

  createComponent(component, element, inputs, outputs): ComponentRef<any> {
    const factory =
      this._componentFactoryResolver.resolveComponentFactory(component);
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
    element.append(domElem);
    return componentRef;
  }

  destroyComponent(componentRef): void {
    this._appRef.detachView(componentRef.hostView);
    componentRef.destroy();
  }

}
