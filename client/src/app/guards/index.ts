import { DefaultSearchGuard } from "./default-search.guard";
import { MultiGuard } from "./multi.guard";
import { SearchGuard } from "./search.guard";
import { SpanSearchGuard } from "./span-search.guard";

export const guards: any[] = [
  DefaultSearchGuard,
  MultiGuard,
  SearchGuard,
  SpanSearchGuard,
];

export * from "./default-search.guard";
export * from "./multi.guard";
export * from "./search.guard";
export * from "./span-search.guard";
