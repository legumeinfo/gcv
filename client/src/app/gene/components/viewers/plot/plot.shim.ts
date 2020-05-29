import { Gene, Plot, Track } from '@gcv/gene/models';


export function plotShim(plot: Plot, genes: Gene[]) {
  const geneMap = {};
  genes.forEach((g) => geneMap[g.name] = g);
  // make plot
  const shimPlot = {
      reference_name: plot.reference.name,
      chromosome_name: plot.sequence.name,
      genes: []
    };
  // make plot genes
  const xCoordinates = plot.pairs.every(({i, j}) => {
      return plot.sequence.genes[j] in geneMap;
    });
  const yCoordinates = plot.pairs.every(({i, j}) => {
      return plot.reference.genes[i] in geneMap;
    });
  const geneToPoint = (g) => (g.fmin+g.fmax)/2;
  plot.pairs.forEach(({i, j}) => {
    const gene = {
        name: plot.reference.genes[i],
        family: plot.reference.families[i],
        x: (xCoordinates) ? geneToPoint(geneMap[plot.sequence.genes[j]]) : j,
        y: (yCoordinates) ? geneToPoint(geneMap[plot.reference.genes[i]]) : i,
      };
    shimPlot.genes.push(gene);
  });
  return shimPlot;
}
