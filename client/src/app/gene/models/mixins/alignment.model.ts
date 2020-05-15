export interface AlignmentMixin {
  alignment: (number|null)[];
  orientations: (null|1|-1)[];
  segments: (number|null)[];
  score: number;
}
