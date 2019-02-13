import { Algorithm, Group, MicroTracks } from "../models";
import { AlignmentMixin, PointMixin } from "../models/mixins";
import { orderAlgorithmFactory } from "../utils";

export const ORDER_ALGORITHMS: Algorithm[] = [
  orderAlgorithmFactory(
    "chromosome",
    "Chromosome name",
    (prefix: any, a: Group, b: Group) => {
      const aName = prefix(a) + a.chromosome_name;
      const bName = prefix(b) + b.chromosome_name;
      return aName.localeCompare(bName);
    },
  ),
  orderAlgorithmFactory(
    "distance",
    "Edit distance",
    (prefix, a: Group<PointMixin> & AlignmentMixin, b: Group<PointMixin> & AlignmentMixin) => {
      const diff = b.score - a.score;
      if (diff === 0) {
        if (a.chromosome_name === b.chromosome_name) {
          if (a.id === b.id) {
            return a.genes[0].x - b.genes[0].x;
          }
          return a.id.localeCompare(b.id);
        }
        const aName = prefix(a) + a.chromosome_name;
        const bName = prefix(b) + b.chromosome_name;
        return aName.localeCompare(bName);
      }
      return diff;
    },
  ),
];
