import { GET, POST, Server } from '../models/server.model';

export const SERVERS: Server[] = [
  {
    id: 'lis',
    name: 'Legume Information System',
    microBasic: {
      type: POST,
      url: 'http://localhost:8000/services/basic_tracks_tree_agnostic/'
    },
    microSearch: {
      type: POST,
      url: 'http://localhost:8000/services/search_tracks_tree_agnostic/'
    },
    microQuery: {
      type: POST,
      url: 'http://localhost:8000/services/gene_to_query/'
    },
    macro: {
      type: POST,
      url: 'http://localhost:8000/services/synteny/'
    },
    geneLinks: {
      type: GET,
      url: 'http://legumeinfo.org/gene_links/'
    },
    plotGlobal: {
      type: POST,
      url: 'http://localhost:8000/services/global_plot_provider_agnostic/'
    }
  }
];
