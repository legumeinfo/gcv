export type TrackID = {name: string, source: string};

export function trackID(name: string, source: string): string;
export function trackID({name, source}): string;
export function trackID(...args): string {
  if (typeof args[0] === 'object') {
    const id = args[0];
    return trackID(id.name, id.source);
  }
  const [name, source] = args;
  return `${name}:${source}`;
}
