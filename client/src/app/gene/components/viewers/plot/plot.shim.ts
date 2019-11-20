import { Gene, Plot, Track } from '@gcv/gene/models';


export function plotShim(plot: Plot, genes: Gene[]) {
  const geneMap = {};
  genes.forEach((g) => geneMap[g.name] = g);
  const reference = plot.reference as Track;
  // make plot
  const shimPlot = {
      chromosome_name: reference.name,
      genes: []
    };
  // make plot genes
  const xCoordinates = plot.pairs.every(({i, j}) => {
      return plot.sequence.genes[j] in geneMap;
    });
  const yCoordinates = plot.pairs.every(({i, j}) => {
      return reference.genes[i] in geneMap;
    });
  const geneToPoint = (g) => (g.fmin+g.fmax)/2;
  plot.pairs.forEach(({i, j}) => {
    const gene = {
        name: reference.genes[i],
        family: reference.families[i],
        x: (xCoordinates) ? geneToPoint(geneMap[plot.sequence.genes[j]]) : j,
        y: (yCoordinates) ? geneToPoint(geneMap[reference.genes[i]]) : i, 
      };
    shimPlot.genes.push(gene);
  });
  return shimPlot;
}
