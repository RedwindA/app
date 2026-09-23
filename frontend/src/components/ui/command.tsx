import { Combobox as Primitive } from "@base-ui/react/combobox";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { uiStrings } from "@/components/ui/strings";
import { cn } from "@/lib/utils";

export type CommandItem = {
  value: string;
  label: string;
  keywords?: string;
  /** Items sharing a `group` render under one heading, in first-seen order. */
  group?: string;
  disabled?: boolean;
};

type CommandGroup = { value: string; items: CommandItem[] };

const SLIDE = {
  type: "spring",
  stiffness: 700,
  damping: 48,
  mass: 0.7,
  opacity: { duration: 0.12 },
} as const;
const INSTANT = { duration: 0 } as const;

function groupItems(items: CommandItem[]): CommandGroup[] {
  // Seed the ungrouped bucket so heading-less items always lead the list
  // instead of trailing a heading and reading as part of that group.
  const groups = new Map<string, CommandItem[]>([["", []]]);
  for (const item of items) {
    const key = item.group ?? "";
    const bucket = groups.get(key);
    if (bucket) bucket.push(item);
    else groups.set(key, [item]);
  }
  return [...groups]
    .filter(([, list]) => list.length > 0)
    .map(([value, list]) => ({ value, items: list }));
}

/** Inline command search; compose inside DialogContent for a command palette. */
export function Command({
  items,
  onSelect,
  label = uiStrings.command.label,
  className,
}: {
  items: CommandItem[];
  onSelect: (value: string) => void;
  label?: string;
  className?: string;
}) {
  const grouped = items.some((item) => item.group);
  const rootItems = useMemo(
    () => (grouped ? groupItems(items) : items),
    [grouped, items],
  );
  const listRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [box, setBox] = useState<{ y: number; height: number } | null>(null);
  const [visible, setVisible] = useState(false);

  // The single highlight block sits behind the list and slides to whichever
  // item Base UI marks `data-highlighted`, whether by pointer or keyboard.
  // Leaving an item (pointer over a group heading) keeps the block where it
  // is until the next item is hit; only an empty result list hides it.
  useLayoutEffect(() => {
    const list = listRef.current;
    const target = list?.querySelector<HTMLElement>("[data-highlighted]");
    if (target) {
      setBox({ y: target.offsetTop, height: target.offsetHeight });
      setVisible(true);
    } else if (!list?.querySelector('[role="option"]')) {
      setVisible(false);
    }
  }, [highlighted, query, items]);

  const transition = reduced ? INSTANT : SLIDE;

  const renderItem = (item: CommandItem) => (
    <Primitive.Item
      key={item.value}
      value={item}
      disabled={item.disabled}
      className="relative flex min-h-11 cursor-default items-center rounded-md px-3 text-[13px] outline-none data-highlighted:text-link sm:min-h-9 data-disabled:opacity-50"
    >
      {item.label}
    </Primitive.Item>
  );

  return (
    <Primitive.Root<CommandItem>
      items={rootItems}
      inline
      open
      autoHighlight
      value={null}
      filter={(item, q) =>
        `${item.label} ${item.keywords ?? ""}`
          .toLocaleLowerCase()
          .includes(q.trim().toLocaleLowerCase())
      }
      onInputValueChange={setQuery}
      onItemHighlighted={(item) => setHighlighted(item?.value ?? null)}
      onValueChange={(item) => {
        if (item) onSelect(item.value);
      }}
    >
      <div
        data-slot="command"
        className={cn(
          "min-w-0 overflow-hidden rounded-lg border bg-popover text-popover-foreground",
          className,
        )}
      >
        <div className="flex items-center gap-2 border-b px-3">
          <MagnifyingGlassIcon
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground"
          />
          <Primitive.Input
            data-slot="command-input"
            aria-label={label}
            placeholder={label}
            className="h-11 min-w-0 flex-1 bg-transparent text-[13px] outline-none"
          />
        </div>
        <Primitive.Empty>
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            {uiStrings.command.empty}
          </p>
        </Primitive.Empty>
        <div ref={listRef} className="relative max-h-64 overflow-y-auto p-1">
          {box ? (
            <m.div
              aria-hidden
              data-slot="command-highlight"
              className="pointer-events-none absolute inset-x-1 top-0 rounded-md bg-accent"
              initial={false}
              animate={{
                y: box.y,
                height: box.height,
                opacity: visible ? 1 : 0,
              }}
              transition={transition}
            />
          ) : null}
          {grouped ? (
            <Primitive.List aria-label={uiStrings.command.list}>
              {(group: CommandGroup) => (
                <Primitive.Group
                  key={group.value}
                  items={group.items}
                  className="py-1 first:pt-0 last:pb-0"
                >
                  {group.value ? (
                    <Primitive.GroupLabel className="px-3 pt-1.5 pb-1 font-mono text-[11px] text-muted-foreground">
                      {group.value}
                    </Primitive.GroupLabel>
                  ) : null}
                  <Primitive.Collection>{renderItem}</Primitive.Collection>
                </Primitive.Group>
              )}
            </Primitive.List>
          ) : (
            <Primitive.List aria-label={uiStrings.command.list}>
              {renderItem}
            </Primitive.List>
          )}
        </div>
      </div>
    </Primitive.Root>
  );
}
