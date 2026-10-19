// The agent's highlight in the viewers. It is the viewers' own hover
// highlighting, published on the GCV event bus, so it looks like the user
// pointing at genes. It lasts until the user's pointer leaves something in
// the view, the agent clears or replaces it, or a viewer redraws.

type BusEvent = {
  type: 'select' | 'deselect';
  targets: Record<string, unknown>;
  // the inter-app channel doesn't forward flagged events, which keeps the
  // agent's pointing in this view
  flag?: boolean;
  agent?: boolean;
};

export interface EventBus {
  subscribe(callback: (event: BusEvent) => void): { unsubscribe(): void };
  publish(event: BusEvent): void;
}

export class AgentHighlight {
  private _targets: BusEvent['targets'][] = [];
  private _subscription: { unsubscribe(): void } | undefined;

  constructor(private _bus: EventBus) {}

  get active(): boolean {
    return this._targets.length > 0;
  }

  show({ genes, families }: { genes: string[]; families: string[] }): void {
    this.clear();
    // a viewer reads one kind of target per event
    if (genes.length > 0) {
      this._targets.push({ genes });
    }
    if (families.length > 0) {
      this._targets.push({ family: families.join(',') });
    }
    this._publish('select');
    // the user's pointer leaving something ends the viewers' hover state,
    // which would otherwise leave the agent's genes marked for the next hover
    this._subscription = this._bus.subscribe((event) => {
      if (!event.agent && event.type === 'deselect') {
        this.clear();
      }
    });
  }

  clear(): void {
    this._subscription?.unsubscribe();
    this._subscription = undefined;
    this._publish('deselect');
    this._targets = [];
  }

  private _publish(type: BusEvent['type']): void {
    this._targets.forEach((targets) =>
      this._bus.publish({ type, targets, flag: true, agent: true }),
    );
  }
}
