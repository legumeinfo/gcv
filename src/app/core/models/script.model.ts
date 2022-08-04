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
