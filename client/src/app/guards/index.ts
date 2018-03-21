import { MultiGuard } from "./multi.guard";
import { SearchGuard } from "./search.guard";

export const guards: any[] = [
  MultiGuard,
  SearchGuard,
];

export * from "./multi.guard";
export * from "./search.guard";
