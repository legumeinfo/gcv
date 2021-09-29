export const GET = 'GET';
export const POST = 'POST';
export const GRPC = 'GRPC';


export class Request {
  type: 'GET' | 'POST' | 'GRPC';
  url: string;
}


export function isRequest(instance: any): instance is Request {
  const request = <Request>instance;
  return request !== null &&
  request.type !== undefined && typeof request.type === 'string' &&
  ['GET', 'POST', 'GRPC'].includes(request.type) &&
  request.url !== undefined && typeof request.url === 'string';
}


export class Script {
  scriptUrl: string;
  functionName: string;
}


export function isScript(instance: any): instance is Script {
  const script = <Script>instance;
  return script !== null &&
  script.scriptUrl !== undefined && typeof script.scriptUrl === 'string' &&
  script.functionName !== undefined && typeof script.functionName === 'string';
}


export class Server {
  id: string;  // unique & url friendly
  name: string;
  genes: Request;
  chromosome: Request;
  microSearch: Request;
  blocks: Request;
  search: Request;
  region: Request;
  geneLinks?: Request;
  familyTreeLink?: Request;
  macroColors?: Script;
}


export function isServer(instance: any): instance is Server {
  const server = <Server>instance;
  return server !== null &&
  server.id !== undefined && typeof server.id === 'string' &&
  server.name !== undefined && typeof server.name === 'string' &&
  server.chromosome !== undefined && isRequest(server.chromosome) &&
  server.microSearch !== undefined && isRequest(server.microSearch) &&
  server.blocks !== undefined && isRequest(server.blocks) &&
  server.search !== undefined && isRequest(server.search) &&
  server.region !== undefined && isRequest(server.region) &&
  (server.geneLinks === undefined || isRequest(server.geneLinks)) &&
  (server.familyTreeLink === undefined || isRequest(server.familyTreeLink)) &&
  (server.macroColors === undefined || isScript(server.macroColors));
}
