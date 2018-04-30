import { Algorithm } from "../models/algorithm.model";
import { Gene } from "../models/gene.model";

import { GCV } from "../../assets/js/gcv";

export const ALIGNMENT_ALGORITHMS: Algorithm[] = [
  {
    algorithm: GCV.alignment.smithWaterman,
    id: "smith-waterman",
    name: "Smith-Waterman",
  },
  {
    algorithm: GCV.alignment.repeat,
    id: "repeat",
    name: "Repeat",
  },
];
