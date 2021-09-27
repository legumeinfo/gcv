import { Track } from '@gcv/gene/models';


export const grpcTrackToModel = (grpcTrack, name, source): Track => {
  const {genesList, familiesList, ...rest} = grpcTrack.toObject();
  const track = {
      name,
      source,
      genes: genesList,
      families: familiesList,
      ...rest
    };
  return track as Track;
}
