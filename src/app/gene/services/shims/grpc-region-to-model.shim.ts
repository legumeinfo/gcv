import { Region } from '@gcv/gene/models';


export const grpcRegionToModel = (grpcRegion, source): Region => {
  const region = grpcRegion.toObject();
  region['source'] = source;
  return region as Region;
}
