import { FormControl } from '@angular/forms';
import {
  PinParams,
  changePins,
  pinParamParsers,
  pinParamValidators,
} from './pin.model';

// Pins live in shared links, which people edit by hand and paste with stray
// commas, so parsing keeps what it can rather than rejecting the parameter.
describe('pin parameters', () => {
  it('parse a comma-separated list, dropping empty and repeated items', () => {
    expect(pinParamParsers.pinfam('f1,,f2, f1 ,')).toEqual(['f1', 'f2']);
    expect(pinParamParsers.pingene('')).toEqual([]);
  });

  it("parse the router's array for a repeated parameter", () => {
    expect(pinParamParsers.pingene(['g1', 'g2', 'g1'])).toEqual(['g1', 'g2']);
  });

  it("accept only 'full' or 'fade' for the labels, or nothing", () => {
    const valid = (value: string) =>
      new FormControl(value, pinParamValidators.pinlabels).valid;
    expect(valid('full')).toBe(true);
    expect(valid('fade')).toBe(true);
    expect(valid('')).toBe(true);
    expect(valid('fullest')).toBe(false);
    expect(valid('nofade')).toBe(false);
  });
});

describe('changePins', () => {
  const current: PinParams = {
    pingene: ['g1', 'g2'],
    pinfam: ['f1'],
    pinlabels: 'full',
  };

  it('replaces both kinds of pin', () => {
    expect(changePins(current, 'replace', { genes: ['g3'] })).toEqual({
      pingene: ['g3'],
      pinfam: [],
      pinlabels: 'full',
    });
  });

  it('adds pins without repeating them', () => {
    expect(
      changePins(current, 'add', { genes: ['g2', 'g3'], families: ['f2'] }),
    ).toMatchObject({ pingene: ['g1', 'g2', 'g3'], pinfam: ['f1', 'f2'] });
  });

  it('removes only the pins named', () => {
    expect(changePins(current, 'remove', { genes: ['g1'] })).toMatchObject({
      pingene: ['g2'],
      pinfam: ['f1'],
    });
  });

  it('clears every pin and the label setting, and keeps the labels otherwise', () => {
    expect(changePins({ ...current, pinlabels: 'fade' }, 'clear', {})).toEqual({
      pingene: [],
      pinfam: [],
      pinlabels: 'full',
    });
    expect(
      changePins({ ...current, pinlabels: 'fade' }, 'remove', {}).pinlabels,
    ).toBe('fade');
    expect(changePins(current, 'add', { labels: 'fade' }).pinlabels).toBe(
      'fade',
    );
  });
});
