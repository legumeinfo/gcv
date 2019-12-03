import { Track, clusteredTrackID } from '@gcv/gene/models';
import { ClusterMixin } from '@gcv/gene/models/mixins';
import { PlotComponent } from './plot.component';


export const plotLayoutComponent = {component: PlotComponent, name: 'plot'};


export function plotStackConfigFactory(track: (Track | ClusterMixin)) {
  const cluster = (track as ClusterMixin).cluster;
  const selected = (track as Track);
  const name = selected.name;
  const id = `plots:${clusteredTrackID(track)}`;
  return {
    type: 'stack',
    id: id,
    title: `${name} (${cluster}) plots`,
    content: [],
  };
}


export function plotConfigFactory(
  type: 'local' | 'global',
  track: (Track | ClusterMixin),
  reference: Track,
  outputs: any={})
{
  const cluster = (track as ClusterMixin).cluster;
  const selected = (track as Track);
  const trackName = selected.name;
  const referenceName = reference.name;
  const options = {autoResize: true};
  const id = `plot:${type}:${clusteredTrackID(track)}x${clusteredTrackID(reference)}`;
  let _outputs = {geneClick: (id, gene, family, source) => { /* no-op */ }};
  _outputs = Object.assign(_outputs, outputs);
  return {
    type: 'component',
    componentName: 'plot',
    id: id,
    title: `${trackName} x ${referenceName} (${cluster}) ${type} plot`,
    componentState: {
      inputs: {type, reference, track, options},
      outputs: {
        geneClick: ({gene, family, source}) => {
          _outputs.geneClick(id, gene, family, source);
        }
      }
    }
  };
}
