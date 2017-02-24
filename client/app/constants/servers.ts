import { GET, POST, Server } from '../models/server.model';

export const SERVERS: Server[] = [
  {
    id: 'lis',
    name: 'Legume Information System',
    microBasic: {
      type: POST,
      url: 'http://localhost:8000/services/v1/micro-synteny-basic/'
    },
    microSearch: {
      type: POST,
      url: 'http://localhost:8000/services/v1/micro-synteny-search/'
    },
    microQuery: {
      type: POST,
      url: 'http://localhost:8000/services/v1/gene-to-query-track/'
    },
    macro: {
      type: POST,
      url: 'http://localhost:8000/services/v1/macro-synteny/'
    },
    geneLinks: {
      type: GET,
      url: 'http://legumeinfo.org/gene_links/'
    },
    plotGlobal: {
      type: POST,
      url: 'http://localhost:8000/services/v1/global-plots/'
    },
    nearestGene: {
      type: POST,
      url: 'http://localhost:8000/services/v1/nearest-gene/'
    }
  }
];
