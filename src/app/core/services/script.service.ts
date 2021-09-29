// Angular
import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Observable, OperatorFunction } from 'rxjs';
import { zip } from 'rxjs/operators';


@Injectable()
export class ScriptService {

  private _scripts: Set<string> = new Set<string>();

  constructor(@Inject(DOCUMENT) private _document: HTMLDocument) { }

  load(...scripts: string[]): OperatorFunction<any, any> {
    const scriptLoaders: Observable<any>[] =
      scripts.map((script) => this.loadScript(script));
    return zip(...scriptLoaders);
  }

  loadScript(src: string): Observable<any> {
    return new Observable((subscriber) => {
      //resolve if already loaded
      if (this._scripts.has(src)) {
        subscriber.complete();
      } else {
        //load script
        const script: any = this._document.createElement('script');
        script.type = 'text/javascript';
        script.src = src;
        script.onerror = subscriber.error;
        if (script.readyState) {  //IE
          script.onreadystatechange = () => {
            if (script.readyState === 'loaded' ||
                script.readyState === 'complete') {
              script.onreadystatechange = null;
              this._scripts.add(src);
              subscriber.complete();
            }
          };
        } else {  //Others
          script.onload = () => {
            this._scripts.add(src);
            subscriber.complete();
          };
        }
        document.getElementsByTagName('head')[0].appendChild(script);
      }
    });
  }

}
