import { describe, expect, expectTypeOf, it } from "vitest";
import {
  searchEnum,
  searchFlag,
  searchInt,
  searchParams,
  searchString,
} from "./search-params";

describe("searchParams", () => {
  const validate = searchParams({
    q: searchString,
    status: searchEnum(["open", "closed"]),
    page: searchInt(),
    archived: searchFlag,
  });

  it("drops missing, empty and invalid values so every key stays optional", () => {
    expect(validate({})).toEqual({});
    expect(
      validate({ q: "", status: "unknown", page: 0, archived: "no" }),
    ).toEqual({});
    expect(validate({ q: 3, status: 1, page: "abc", extra: "x" })).toEqual({});
  });

  it("keeps valid values and accepts JSON-decoded or raw string numbers", () => {
    expect(
      validate({ q: "hello", status: "closed", page: 2, archived: true }),
    ).toEqual({ q: "hello", status: "closed", page: 2, archived: true });
    expect(validate({ page: "5", archived: "1" })).toEqual({
      page: 5,
      archived: true,
    });
    expect(validate({ page: 2.5 })).toEqual({});
  });

  it("respects integer bounds", () => {
    const bounded = searchInt({ min: 0, max: 10 });
    expect(bounded(0)).toBe(0);
    expect(bounded(10)).toBe(10);
    expect(bounded(11)).toBeUndefined();
    expect(bounded(-1)).toBeUndefined();
  });

  it("infers an object type with optional, narrowed keys", () => {
    expectTypeOf(validate({})).toEqualTypeOf<{
      q?: string;
      status?: "open" | "closed";
      page?: number;
      archived?: true;
    }>();
  });
});
