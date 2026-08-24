import { clusteredTrackID } from '@gcv/gene/models';
import { TrackDetailComponent } from './track-detail.component';


export const trackDetailLayoutComponent =
  {component: TrackDetailComponent, name: 'track'};


export function trackDetailConfigFactory(track) {
  const id = `track:${clusteredTrackID(track)}`;
  return {
    type: 'component',
    componentType: 'track',
    id: id,
    title: `Track: ${track.name}`,
    componentState: {inputs: {track}},
  };
}
