// Angular
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
// app
import { Track } from '@gcv/gene/models';
import { HttpService } from '@gcv/core/services/http.service';


@Injectable()
export class ChromosomeService extends HttpService {

  constructor(private _http: HttpClient) {
    super(_http);
  }

  // fetches chromosome for the given chromosome id from the given source
  getChromosome(chromosome: string, serverID: string):
  Observable<Track> {
    const body = {chromosome};
    return this._makeRequest<{chromosome: Track}>
    (serverID, 'chromosome', body).pipe(
      map((result) => {
        const c = result.chromosome;
        c.name = chromosome;
        c.source = serverID;
        return c;
      }),
      catchError((error) => throwError(error)),
    );
  }
}
