import { GET, POST, Server } from '../models/server.model';

export const SERVERS: Server[] = [
  {
    id: 'lis',
    name: 'Legume Information System',
    microBasic: {
      type: POST,
      url: 'http://localhost:8000/services/micro-synteny-basic/'
    },
    microSearch: {
      type: POST,
      url: 'http://localhost:8000/services/micro-synteny-search/'
    },
    microQuery: {
      type: POST,
      url: 'http://localhost:8000/services/micro-synteny-gene-to-query/'
    },
    macro: {
      type: POST,
      url: 'http://localhost:8000/services/macro-synteny/'
    },
    geneLinks: {
      type: GET,
      url: 'http://legumeinfo.org/gene_links/'
    },
    plotGlobal: {
      type: POST,
      url: 'http://localhost:8000/services/global-plots/'
    },
    nearestGene: {
      type: POST,
      url: 'http://localhost:8000/services/nearest-gene/'
    }
  }
];
