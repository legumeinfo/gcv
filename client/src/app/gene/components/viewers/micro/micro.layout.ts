import { MicroComponent } from './micro.component';


export const microLayoutComponent = {component: MicroComponent, name: 'micro'};


export function microConfigFactory(clusterID: number, outputs: any={}) {
  const id = `micro${clusterID}`;
  const options = {};
  let _outputs = {
      plotClick: (e, id, track, queryTracks) => { /* no-op */ },
      geneClick: (id, gene, family, source) => { /* no-op */ },
      geneOver: (e, gene, family, source) => { /* no-op */ },
      nameClick: (id, track) => { /* no-op */ },
      circos: (id, tracks) => { /* no-op */ },
      reference: (id, name, source, clusterID) => { /* no-op */ },
    };
  _outputs = Object.assign(_outputs, outputs);
  return  {
    type: 'component',
    componentName: 'micro',
    id: id,
    title: `Micro Synteny Cluster ${clusterID}`,
    componentState: {
      inputs: {clusterID, options},
      outputs: {
        plotClick: ({event, track, queryTracks}) => {
          _outputs.plotClick(event, id, track, queryTracks);
        },
        geneClick: ({gene, family, source}) => {
          _outputs.geneClick(id, gene, family, source);
        },
        geneOver: ({event, gene, family, source}) => {
          _outputs.geneOver(event, gene, family, source);
        },
        nameClick: ({track}) => _outputs.nameClick(id, track),
        circos: ({tracks}) => _outputs.circos(id, clusterID),
        reference: ({track}) => {
          _outputs.reference(id, track.name, track.source, clusterID);
        },
      },
    },
    isClosable: false
  };
}
