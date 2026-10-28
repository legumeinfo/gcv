// Angular
import { Validators } from '@angular/forms';

// Genes and families the user or an agent pinned: marked in the viewers until
// unpinned, unlike hovering, and kept in the URL so a shared view shows them.
export type PinParams = {
  pinfam: string[]; // family IDs
  pingene: string[]; // gene names
  pinlabels: 'full' | 'fade'; // whether track labels fade with unpinned genes
};

export const pinParamMembers = ['pinfam', 'pingene', 'pinlabels'];

export const pinParamValidators = {
  pinlabels: Validators.pattern('(full|fade)'),
};

// a comma-separated list, or the router's array for a repeated parameter;
// empty and repeated items are dropped, so one stray comma costs nothing
const list = (s: string | string[]): string[] => {
  const items = (Array.isArray(s) ? s : String(s).split(',')).map((i) =>
    i.trim(),
  );
  return Array.from(new Set(items.filter((i) => i !== '')));
};

export const pinParamParsers = {
  pinfam: list,
  pingene: list,
  pinlabels: (s) => s,
};

// how a pin change combines with the current pins
export type PinMode = 'replace' | 'add' | 'remove' | 'clear';

export type PinChange = {
  genes?: string[];
  families?: string[];
  labels?: PinParams['pinlabels'];
};

export function changePins(
  current: PinParams,
  mode: PinMode,
  { genes = [], families = [], labels }: PinChange,
): PinParams {
  const combine = (pinned: string[], changed: string[]): string[] => {
    switch (mode) {
      case 'replace':
        return Array.from(new Set(changed));
      case 'add':
        return Array.from(new Set([...pinned, ...changed]));
      case 'remove':
        return pinned.filter((id) => !changed.includes(id));
      case 'clear':
        return [];
    }
  };
  return {
    pingene: combine(current.pingene, genes),
    pinfam: combine(current.pinfam, families),
    // the label setting means nothing without pins
    pinlabels: labels ?? (mode === 'clear' ? 'full' : current.pinlabels),
  };
}
