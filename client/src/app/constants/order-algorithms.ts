import { Algorithm } from "../models/algorithm.model";
import { Group } from "../models/group.model";
import { MicroTracks } from "../models/micro-tracks.model";
import { orderAlgorithmFactory } from "../utils/order-algorithm-factory.util";

export const ORDER_ALGORITHMS: Algorithm[] = [
  orderAlgorithmFactory(
    "chromosome",
    "Chromosome name",
    (a: Group, b: Group) => a.chromosome_name.localeCompare(b.chromosome_name),
  ),
  orderAlgorithmFactory(
    "distance",
    "Edit distance",
    (a: Group, b: Group) => {
      const diff = b.score - a.score;
      if (diff === 0) {
        if (a.chromosome_name === b.chromosome_name) {
          if (a.id === b.id) {
            return a.genes[0].x - b.genes[0].x;
          }
          return a.id - b.id;
        }
        return (a.chromosome_name > b.chromosome_name) ? 1 : -1;
      }
      return diff;
    },
  ),
];
