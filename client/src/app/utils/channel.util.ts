import { MicroTracks } from "../models";


// A generic class used to instantiate channels for inter-application
// communication (currently only the Broadcast Channel API is implemented). Also
// optionally performs message enrichment before broadcasting.
export class Channel {
  private bc;

  constructor(channel: string) {
    this.bc = new BroadcastChannel(channel);
  }

  postMessage(message, enrich?: MicroTracks): void {
    if (enrich !== undefined) {
      message = this.enrich(message, enrich);
    }
    this.bc.postMessage(message);
  }

  onmessage(callback): void {
      this.bc.onmessage = callback;
  }

  close(): void {
    this.bc.close();
  }

  private enrich(message, microTracks: MicroTracks): any {
    if (message.targets.hasOwnProperty("family") &&
        !message.targets.hasOwnProperty("genes")) {
      const genes = microTracks.groups
        .reduce((familyGenes, group) => {
          const groupGenes = group.genes
            .reduce((filteredGenes, gene) => {
              if (gene.family === message.targets.family) {
                filteredGenes.push(gene.name);
              }
              return filteredGenes;
            }, []);
          familyGenes.push(...groupGenes);
          return familyGenes;
        }, []);
      message = {type: message.type, targets: {genes, ...message.targets}};
    }
    return message;
  }
}
