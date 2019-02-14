export function regexpOr(...args: string[]) {
  return args.map((r) => `(${r})`).join("|");
}
