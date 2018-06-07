import { CustomRouterStateSerializer } from "./custom-router-state-serializer.util";
import { elementIsVisible } from "./element-is-visible.util";
import { instantiateAndPopulate } from "./instantiate-and-populate.util";
import { orderAlgorithmFactory, orderFilter } from "./order-algorithm-factory.util";
import { regexpAlgorithmFactory, regexpFilter } from "./regexp-algorithm-factory.util";

export const utils: any[] = [
  CustomRouterStateSerializer,
  elementIsVisible,
  instantiateAndPopulate,
  orderAlgorithmFactory,
  orderFilter,
  regexpAlgorithmFactory,
  regexpFilter,
];

export * from "./custom-router-state-serializer.util";
export * from "./element-is-visible.util";
export * from "./instantiate-and-populate.util";
export * from "./order-algorithm-factory.util";
export * from "./regexp-algorithm-factory.util";
