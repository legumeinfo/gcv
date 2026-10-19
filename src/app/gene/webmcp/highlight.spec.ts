import { eventBus } from '@gcv-assets/js/gcv/common/eventbus';
import { AgentHighlight } from './highlight';

describe('AgentHighlight', () => {
  let events: any[];
  let subscription: { unsubscribe(): void };
  let highlight: AgentHighlight;

  beforeEach(() => {
    events = [];
    subscription = eventBus.subscribe((e) => events.push(e));
    highlight = new AgentHighlight(eventBus);
  });

  afterEach(() => {
    highlight.clear();
    subscription.unsubscribe();
  });

  it('selects genes and families in separate events, kept from other apps', () => {
    highlight.show({ genes: ['g1', 'g2'], families: ['f1', 'f2'] });
    expect(events).toEqual([
      {
        type: 'select',
        targets: { genes: ['g1', 'g2'] },
        flag: true,
        agent: true,
      },
      { type: 'select', targets: { family: 'f1,f2' }, flag: true, agent: true },
    ]);
  });

  it('deselects the previous highlight before a new one', () => {
    highlight.show({ genes: ['g1'], families: [] });
    events = [];
    highlight.show({ genes: [], families: ['f1'] });
    expect(events.map((e) => [e.type, e.targets])).toEqual([
      ['deselect', { genes: ['g1'] }],
      ['select', { family: 'f1' }],
    ]);
  });

  it("ends when the user's pointer leaves something in the view", () => {
    highlight.show({ genes: ['g1'], families: [] });
    eventBus.publish({ type: 'select', targets: { genes: ['g9'] } });
    expect(highlight.active).toBe(true);
    events = [];
    eventBus.publish({ type: 'deselect', targets: { genes: ['g9'] } });
    expect(highlight.active).toBe(false);
    expect(events[1]).toMatchObject({
      type: 'deselect',
      targets: { genes: ['g1'] },
      agent: true,
    });
  });
});
