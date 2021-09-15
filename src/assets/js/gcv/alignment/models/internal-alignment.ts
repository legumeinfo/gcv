export class InternalAlignment {
  coordinates: (number|null)[];
  scores: (number|null)[];
}


export class MergedInternalAlignment {
  coordinates: (number|null)[];
  orientations: (null|1|-1)[];
  segments: (number|null)[];
  scores: (number|null)[];
}
