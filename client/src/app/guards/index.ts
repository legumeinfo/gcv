import { DefaultSearchGuard } from "./default-search.guard";
import { MultiGuard } from "./multi.guard";
import { SearchGuard } from "./search.guard";

export const guards: any[] = [
  DefaultSearchGuard,
  MultiGuard,
  SearchGuard,
];

export * from "./default-search.guard";
export * from "./multi.guard";
export * from "./search.guard";
