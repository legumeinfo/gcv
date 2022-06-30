import { AppConfig } from '@gcv/core/models';
import { Params } from '@gcv/gene/models/params';


export const initialState: Params = {
  // alignment
  algorithm:  AppConfig.defaultParameters.gene.microSyntenyAlignment.algorithm,
  match: AppConfig.defaultParameters.gene.microSyntenyAlignment.match,
  mismatch: AppConfig.defaultParameters.gene.microSyntenyAlignment.mismatch,
  gap: AppConfig.defaultParameters.gene.microSyntenyAlignment.gap,
  score: AppConfig.defaultParameters.gene.microSyntenyAlignment.score,
  threshold: AppConfig.defaultParameters.gene.microSyntenyAlignment.threshold,
  // block
  bmatched: AppConfig.defaultParameters.gene.macroSynteny.matched,
  bintermediate: AppConfig.defaultParameters.gene.macroSynteny.intermediate,
  bmask: AppConfig.defaultParameters.gene.macroSynteny.mask,
  bchrgenes: AppConfig.defaultParameters.gene.macroSynteny.minChromosomeGenes,
  bchrlength: AppConfig.defaultParameters.gene.macroSynteny.minChromosomeLength,
  // clustering
  linkage: AppConfig.defaultParameters.gene.microSyntenyClustering.linkage,
  cthreshold: AppConfig.defaultParameters.gene.microSyntenyClustering.cthreshold,
  // query
  neighbors: AppConfig.defaultParameters.gene.microSynteny.neighbors,
  matched: AppConfig.defaultParameters.gene.microSynteny.matched,
  intermediate: AppConfig.defaultParameters.gene.microSynteny.intermediate,
  // sources
  sources: AppConfig.getServerIDs(),
  // macro filters
  bregexp: '',
  border: AppConfig.defaultParameters.gene.macroSyntenyOrder,
  // micro filters
  regexp: '',
  order: AppConfig.defaultParameters.gene.microSyntenyOrder,
};
