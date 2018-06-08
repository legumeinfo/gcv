import { Alert } from "./alert.model";
import { AlignmentParams } from "./alignment-params.model";
import { Algorithm } from "./algorithm.model";
import { BlockParams } from "./block-params.model";
import { ClusteringParams } from "./clustering-params.model";
import { Config } from "./config.model";
import { Family } from "./family.model";
import { GeneLoc } from "./gene-loc.model";
import { Gene } from "./gene.model";
import { Group } from "./group.model";
import { MacroBlock } from "./macro-block.model";
import { MacroChromosome } from "./macro-chromosome.model";
import { MacroTrack } from "./macro-track.model";
import { MacroTracks } from "./macro-tracks.model";
import { MicroTracks } from "./micro-tracks.model";
import { QueryParams } from "./query-params.model";
import { GET, POST, Request, Server } from "./server.model";

export const models: any[] = [
  Alert,
  AlignmentParams,
  Algorithm,
  BlockParams,
  ClusteringParams,
  Config,
  Family,
  GeneLoc,
  Gene,
  Group,
  MacroBlock,
  MacroChromosome,
  MacroTrack,
  MacroTracks,
  MicroTracks,
  QueryParams,
  GET,
  POST,
  Request,
  Server,
];

export * from "./alert.model";
export * from "./alignment-params.model";
export * from "./algorithm.model";
export * from "./block-params.model";
export * from "./clustering-params.model";
export * from "./config.model";
export * from "./family.model";
export * from "./gene-loc.model";
export * from "./gene.model";
export * from "./group.model";
export * from "./macro-block.model";
export * from "./macro-chromosome.model";
export * from "./macro-track.model";
export * from "./macro-tracks.model";
export * from "./micro-tracks.model";
export * from "./query-params.model";
export * from "./server.model";
