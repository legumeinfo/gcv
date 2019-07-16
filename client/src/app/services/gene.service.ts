// Angular
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";
// app
import { Gene } from "../models";
import { HttpService } from "./http.service";

@Injectable()
export class GeneService extends HttpService {

  constructor(private _http: HttpClient) {
    super(_http);
  }

  // fetches genes for the given gene ids from the given source
  getGenes(genes: string[], serverID: string): Observable<Gene[]> {
    const body = {genes};
    return this._makeRequest<{genes: Gene[]}>(serverID, "genes", body).pipe(
      map((result) => {
        result.genes.forEach((g) => g.source = serverID);
        return result.genes;
      }),
      catchError((error) => throwError(error)),
    );
  }
}
