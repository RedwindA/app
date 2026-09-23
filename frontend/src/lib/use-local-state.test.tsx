import { StrictMode, useEffect } from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useLocalState } from "./use-local-state";
const isNumber = (value: unknown): value is number => typeof value === "number";
let id = 0;
const key = () => `test-local-${++id}`;

describe("useLocalState", () => {
  it("supports consecutive functional updates in StrictMode and writes once per action", () => {
    const name = key();
    const { result } = renderHook(() => useLocalState(name, 0, isNumber), {
      wrapper: StrictMode,
    });
    const write = vi.spyOn(Storage.prototype, "setItem");
    act(() => {
      result.current[1]((value) => value + 1);
      result.current[1]((value) => value + 1);
    });
    expect(result.current[0]).toBe(2);
    expect(localStorage.getItem(name)).toBe("2");
    expect(write).toHaveBeenCalledTimes(2);
    write.mockRestore();
  });
  it("synchronizes subscribers in the same tab", () => {
    const name = key();
    const first = renderHook(() => useLocalState(name, 0, isNumber));
    const second = renderHook(() => useLocalState(name, 0, isNumber));
    act(() => first.result.current[1](5));
    expect(second.result.current[0]).toBe(5);
  });
  it("accepts cross-tab updates and resets when storage is removed or cleared", () => {
    const name = key();
    const { result } = renderHook(() => useLocalState(name, 3, isNumber));
    const sync = (storageKey: string | null, newValue: string | null) =>
      act(() => {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: storageKey,
            newValue,
            storageArea: localStorage,
          }),
        );
      });
    sync(name, "9");
    expect(result.current[0]).toBe(9);
    sync(name, null);
    expect(result.current[0]).toBe(3);
    sync(name, "11");
    sync(null, null);
    expect(result.current[0]).toBe(3);
    sync("unrelated", "99");
    expect(result.current[0]).toBe(3);
  });
  it("rejects malformed or invalid stored data", () => {
    const name = key();
    localStorage.setItem(name, "not json");
    const { result } = renderHook(() => useLocalState(name, 4, isNumber));
    expect(result.current[0]).toBe(4);
    act(() =>
      window.dispatchEvent(
        new StorageEvent("storage", { key: name, newValue: '"wrong type"' }),
      ),
    );
    expect(result.current[0]).toBe(4);
  });
  it("keeps functional state usable when storage throws", () => {
    const name = key();
    const read = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    const write = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("full");
      });
    try {
      const { result } = renderHook(() => useLocalState(name, 0, isNumber));
      act(() => {
        result.current[1]((value) => value + 1);
        result.current[1]((value) => value + 1);
      });
      expect(result.current[0]).toBe(2);
    } finally {
      read.mockRestore();
      write.mockRestore();
    }
  });
  it("switches storage keys without overwriting either value", () => {
    const first = key();
    const second = key();
    localStorage.setItem(first, "6");
    localStorage.setItem(second, "8");
    const { result, rerender } = renderHook(
      ({ name }) => useLocalState(name, 0, isNumber),
      { initialProps: { name: first } },
    );
    expect(result.current[0]).toBe(6);
    rerender({ name: second });
    expect(result.current[0]).toBe(8);
    expect(localStorage.getItem(first)).toBe("6");
  });
});

type Preferences = { name: string };
const isPreferences = (value: unknown): value is Preferences =>
  typeof value === "object" &&
  value !== null &&
  "name" in value &&
  typeof value.name === "string";

describe("useLocalState reference stability", () => {
  it("preserves stored object identity and effect dependencies across unrelated renders", () => {
    const name = key();
    localStorage.setItem(name, JSON.stringify({ name: "Workspace" }));
    const effect = vi.fn();
    const { result, rerender } = renderHook(() => {
      const [value, save] = useLocalState(
        name,
        { name: "Fallback" },
        isPreferences,
      );
      useEffect(() => {
        effect(value);
      }, [value]);
      return [value, save] as const;
    });
    const initial = result.current[0];
    rerender();
    expect(result.current[0]).toBe(initial);
    expect(effect).toHaveBeenCalledTimes(1);
    act(() => result.current[1]({ name: "Workspace" }));
    expect(result.current[0]).toBe(initial);
    act(() =>
      result.current[1]((previous) => ({ name: previous.name + " 2" })),
    );
    expect(result.current[0]).not.toBe(initial);
    expect(result.current[0].name).toBe("Workspace 2");
    expect(effect).toHaveBeenCalledTimes(2);
    const updated = result.current[0];
    rerender();
    expect(result.current[0]).toBe(updated);
    expect(effect).toHaveBeenCalledTimes(2);
  });

  it("shares decoded references across subscribers and updates them on storage events", () => {
    const name = key();
    localStorage.setItem(name, JSON.stringify({ name: "First" }));
    const first = renderHook(() =>
      useLocalState(name, { name: "Fallback" }, isPreferences),
    );
    const second = renderHook(() =>
      useLocalState(name, { name: "Fallback" }, isPreferences),
    );
    const initial = first.result.current[0];
    expect(second.result.current[0]).toBe(initial);
    const sync = (value: string) =>
      act(() =>
        window.dispatchEvent(
          new StorageEvent("storage", { key: name, newValue: value }),
        ),
      );
    sync(JSON.stringify({ name: "First" }));
    expect(first.result.current[0]).toBe(initial);
    sync(JSON.stringify({ name: "Second" }));
    const updated = first.result.current[0];
    expect(updated).not.toBe(initial);
    expect(updated.name).toBe("Second");
    expect(second.result.current[0]).toBe(updated);
    first.rerender();
    expect(first.result.current[0]).toBe(updated);
  });

  it("keeps validation and fallbacks local to each subscriber", () => {
    const name = key();
    localStorage.setItem(name, JSON.stringify({ name: "Saved" }));
    const fallback = { name: "Fallback" };
    const reject = (value: unknown): value is Preferences =>
      isPreferences(value) && value.name === "Only this name is accepted";
    const accepted = renderHook(() =>
      useLocalState(name, fallback, isPreferences),
    );
    const rejected = renderHook(
      ({ validate }) => useLocalState(name, fallback, validate),
      { initialProps: { validate: reject } },
    );
    expect(accepted.result.current[0].name).toBe("Saved");
    expect(rejected.result.current[0]).toBe(fallback);
    rejected.rerender({ validate: isPreferences });
    expect(rejected.result.current[0]).toBe(accepted.result.current[0]);
    act(() =>
      window.dispatchEvent(
        new StorageEvent("storage", { key: name, newValue: "bad json" }),
      ),
    );
    expect(accepted.result.current[0]).toBe(fallback);
    expect(rejected.result.current[0]).toBe(fallback);
    accepted.rerender();
    expect(accepted.result.current[0]).toBe(fallback);
  });
});
