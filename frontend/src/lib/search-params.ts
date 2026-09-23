// Parsers for TanStack Router `validateSearch`. Every parser returns
// `undefined` for missing or invalid input, so validated keys are optional
// in the route's search type, absent from the URL by default, and removable
// via `navigate({ search: (previous) => ({ ...previous, page: undefined }) })`.
export type SearchParser<T> = (raw: unknown) => T | undefined;

type ParsedSearch<S extends Record<string, SearchParser<unknown>>> = {
  [K in keyof S]?: S[K] extends SearchParser<infer T> ? T : never;
};

export function searchParams<S extends Record<string, SearchParser<unknown>>>(
  parsers: S,
) {
  return (search: Record<string, unknown>): ParsedSearch<S> => {
    const result: Record<string, unknown> = {};
    for (const key in parsers) {
      const parse = parsers[key];
      if (parse === undefined) continue;
      const value = parse(search[key]);
      if (value !== undefined) result[key] = value;
    }
    return result as ParsedSearch<S>;
  };
}

export const searchString: SearchParser<string> = (raw) =>
  typeof raw === "string" && raw !== "" ? raw : undefined;

export function searchEnum<const T extends readonly string[]>(
  values: T,
): SearchParser<T[number]> {
  return (raw) =>
    typeof raw === "string" && values.includes(raw) ? raw : undefined;
}

// The router JSON-decodes values, so `?page=2` arrives as a number; plain
// strings still arrive when the value is not valid JSON.
export function searchInt({
  min = 1,
  max = Number.MAX_SAFE_INTEGER,
}: { min?: number; max?: number } = {}): SearchParser<number> {
  return (raw) => {
    const value =
      typeof raw === "number"
        ? raw
        : typeof raw === "string" && raw !== ""
          ? Number(raw)
          : NaN;
    return Number.isInteger(value) && value >= min && value <= max
      ? value
      : undefined;
  };
}

export const searchFlag: SearchParser<true> = (raw) =>
  raw === true || raw === "true" || raw === "1" || raw === 1 ? true : undefined;
