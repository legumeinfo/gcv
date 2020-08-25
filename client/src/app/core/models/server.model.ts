export const GET = 'GET';
export const POST = 'POST';

export class Request {
  type: 'GET' | 'POST';
  url: string;
}

export class Server {
  id: string;  // unique & url friendly
  name: string;
  genes: Request;
  chromosome: Request;
  microSearch: Request;
  blocks: Request;
  geneLinks: Request;
  familyTreeLink: Request;
  search: Request;
  region: Request;
}
