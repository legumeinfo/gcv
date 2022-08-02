// Angular
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, endWith, map } from 'rxjs/operators';
// store
import { Store, select } from '@ngrx/store';
import * as pairwiseBlocksActions
  from '@gcv/gene/store/actions/pairwise-blocks.actions';
import * as routerActions from '@gcv/store/actions/router.actions';
import * as fromRoot from '@gcv/store/reducers';
import * as fromPairwiseBlocks from '@gcv/gene/store/selectors/pairwise-blocks/';
// app
import { GCV } from '@gcv-assets/js/gcv';
import { AppConfig, ConfigError, GET, POST, GRPC } from '@gcv/core/models';
import { HttpService, ScriptService } from '@gcv/core/services';
import { executeFunctionByName } from '@gcv/core/utils';
import { PairwiseBlocks, PairwiseBlock, Track } from '@gcv/gene/models';
import { BlockParams } from '@gcv/gene/models/params';
import { grpcBlocksToModel } from './shims';
// api
import { MacroSyntenyBlocksComputeReply, MacroSyntenyBlocksComputeRequest,
  MacroSyntenyBlocksPromiseClient } from 'legumeinfo-microservices/dist/macrosyntenyblocks_service/v1';


type RawPairwiseBlocks = {
  chromosome: string,
  genus: string,
  species: string,
  blocks: PairwiseBlock[],
};


@Injectable()
export class PairwiseBlocksService extends HttpService {

  constructor(private _appConfig: AppConfig,
              private _http: HttpClient,
              private _scriptService: ScriptService,
              private _store: Store<fromRoot.State>) {
    super(_http);
  }

  getPairwiseBlocks(
    chromosome: Track,
    blockParams: BlockParams,
    serverID: string,
    targets: string[] = []):
  Observable<PairwiseBlocks[]> {
    const request = this._appConfig.getServerRequest(serverID, 'blocks');
    const optionalMetrics = ['jaccard:2:1:1'];  // jaccard, 2-grams, 1 => compute reversals, multiSet True
    if (request.type === GET || request.type === POST) {
      const body = {
        chromosome: chromosome.families,
        intermediate: blockParams.bintermediate,
        matched: blockParams.bmatched,
        targets,
        mask: blockParams.bmask,
        optionalMetrics,
        chromosomeGenes: blockParams.bchrgenes,
        chromosomeLength: blockParams.bchrlength,
      };
      return this._makeHttpRequest<{blocks: RawPairwiseBlocks[]}>(request, body).pipe(
        map((result) => {
          const blocks = result.blocks.map((block) => {
            return {
              reference: chromosome.name,
              referenceSource: chromosome.source,
              chromosome: block.chromosome,
              chromosomeSource: serverID,
              chromosomeGenus: block.genus,
              chromosomeSpecies: block.species,
              blocks: block.blocks,
            };
          });
          return blocks;
        }),
        catchError((error) => throwError(error)),
      );
    } else if (request.type === GRPC) {
      const client = new MacroSyntenyBlocksPromiseClient(request.url);
      const grpcRequest = new MacroSyntenyBlocksComputeRequest();
      grpcRequest.setChromosomeList(chromosome.families);
      grpcRequest.setMatched(blockParams.bmatched);
      grpcRequest.setIntermediate(blockParams.bintermediate);
      grpcRequest.setTargetsList(targets);
      grpcRequest.setMask(blockParams.bmask);
      grpcRequest.setOptionalmetricsList(optionalMetrics);
      grpcRequest.setChromosomegenes(blockParams.bchrgenes);
      grpcRequest.setChromosomelength(blockParams.bchrlength);
      const clientRequest = client.compute(grpcRequest, {});
      return from(clientRequest).pipe(
        map((result: MacroSyntenyBlocksComputeReply) => {
          const blocks = result.getBlocksList().map((b) => {
              return grpcBlocksToModel(b, chromosome, serverID);
            });
          return blocks;
        }),
        catchError((error) => throwError(error)),
      );
    }
    const error = new ConfigError('Unsupported request type \'' + request.type + '\'');
    return throwError(error);
  }

  getPairwiseBlocksForTracks(
    tracks: Track[],
    sources: string[],
    params: BlockParams,
    // TODO: targets should specify sources
    targets: string[] = []):
  Observable<PairwiseBlocks[]> {
    const trackActions = tracks.map((t) => {
        return sources.map((s) => {
          const payload = {chromosome: t, source: s, params, targets};
          return new pairwiseBlocksActions.Get(payload);
        });
      });
    trackActions.forEach((ta) => ta.forEach((a) => this._store.dispatch(a)));
    const targetSet = new Set(targets);
    return this._store.pipe(
      select(
        fromPairwiseBlocks
          .getFilteredAndOrderedPairwiseBlocksForTracks(tracks, sources)
      ),
      // TODO: there should be a selector for this
      map((blocks) => {
        if (targetSet.size == 0) {
          return blocks;
        }
        return blocks.filter((b) => targetSet.has(b.chromosome));
      }),
    );
  }

  updateParams(params: BlockParams): void {
    const path = [];
    const query = Object.assign({}, params);
    this._store.dispatch(new routerActions.Go({path, query}));
  }

  getMacroColors(): Observable<Function|undefined> {
    // use colors from config file
    const macroConfig: any = this._appConfig.macroLegend;
    console.log(macroConfig);
    if (macroConfig !== undefined && macroConfig.colors !== undefined) {
      let func: Function = (args) => {
          return executeFunctionByName(macroConfig.colors.functionName, window, args);
        };
      return this._scriptService.loadScript(macroConfig.colors.scriptUrl)
        .pipe(endWith(func));
    }
    // use GCV colors by default
    return of(GCV.common.colors);
  }
}
