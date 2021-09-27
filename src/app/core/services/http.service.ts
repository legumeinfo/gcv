// Angular
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { filter, share } from 'rxjs/operators';
// app
import { ConfigError } from '@gcv/app.config';
import { GET, POST, Request } from '@gcv/core/models';

export abstract class HttpService {

  constructor(private http: HttpClient) {}

  // encapsulates HTTP request boilerplate
  protected _makeHttpRequest<T>(
    request: Request,
    body: any = {},
    makeUrl = ((url: string) => url),
  ): Observable<T> {
    const url = makeUrl(request.url);
    if (request.type === GET) {
      const params = new HttpParams({fromObject: body});
      return this.http.get<T>(url, {params}).pipe(share());
    } else if (request.type === POST) {
      return this.http.post<T>(url, body).pipe(share());
    }
    const error = new ConfigError('\'' + request.url + '\' is not configured to receive HTTP GET or POST requests');
    return throwError(error);
  }
}
