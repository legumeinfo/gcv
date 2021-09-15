import { clusteredTrackID } from '@gcv/gene/models';
import { TrackDetailComponent } from './track-detail.component';


export const trackDetailLayoutComponent =
  {component: TrackDetailComponent, name: 'track'};


export function trackDetailConfigFactory(track) {
  const first = track.genes[0];
  const last = track.genes[track.genes.length-1];
  const id = `track:${clusteredTrackID(track)}`;
  return {
    type: 'component',
    componentName: 'track',
    id: id,
    title: `Track: ${track.name}`,
    componentState: {inputs: {track}},
  };
}
