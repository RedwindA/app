import { useState, type KeyboardEvent } from "react";
import { XIcon } from "@phosphor-icons/react";
import type { JobMetadata } from "@/api/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type MetadataDraft = Required<Omit<JobMetadata, "authors">> & {
  authors: string[];
};

export const emptyMetadata: MetadataDraft = {
  title_main: "",
  title_sub: "",
  authors: [],
  translator: "",
  header_left: "",
  pdf_title: "",
  pdf_author: "",
};

/** Trimmed metadata, or an error message when required fields are missing. */
export function finalizeMetadata(
  draft: MetadataDraft,
): { ok: true; value: JobMetadata } | { ok: false; error: string } {
  const value = {
    title_main: draft.title_main.trim(),
    title_sub: draft.title_sub.trim(),
    authors: draft.authors,
    translator: draft.translator.trim(),
    header_left: draft.header_left.trim(),
    pdf_title: draft.pdf_title.trim(),
    pdf_author: draft.pdf_author.trim(),
  };
  if (!value.title_main) return { ok: false, error: "请填写书名。" };
  return { ok: true, value };
}

function TextField({
  id,
  label,
  hint,
  maxLength = 200,
  ...props
}: {
  id: keyof MetadataDraft;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
  invalid?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="grid content-start gap-2">
      <Label htmlFor={id}>
        {label}
        {props.required && (
          <span aria-hidden className="text-destructive">
            *
          </span>
        )}
      </Label>
      <Input
        id={id}
        name={id}
        maxLength={maxLength}
        value={props.value}
        placeholder={props.placeholder}
        required={props.required}
        disabled={props.disabled}
        aria-invalid={props.invalid || undefined}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(e) => props.onChange(e.target.value)}
      />
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-faint">
          {hint}
        </p>
      )}
    </div>
  );
}

export function MetadataForm({
  value,
  onChange,
  titleInvalid,
  disabled,
}: {
  value: MetadataDraft;
  onChange: (value: MetadataDraft) => void;
  titleInvalid?: boolean;
  disabled?: boolean;
}) {
  const [authorDraft, setAuthorDraft] = useState("");
  const set =
    <K extends keyof MetadataDraft>(key: K) =>
    (next: MetadataDraft[K]) =>
      onChange({ ...value, [key]: next });

  function pushAuthor() {
    const name = authorDraft.trim();
    setAuthorDraft("");
    if (!name || value.authors.includes(name) || value.authors.length >= 20)
      return;
    set("authors")([...value.authors, name]);
  }

  function onAuthorKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" || e.key === "," || e.key === "，") {
      e.preventDefault();
      pushAuthor();
    } else if (e.key === "Backspace" && !authorDraft && value.authors.length) {
      set("authors")(value.authors.slice(0, -1));
    }
  }

  const pdfTitlePlaceholder = value.title_sub
    ? `${value.title_main}：${value.title_sub}`
    : value.title_main;
  const pdfAuthorPlaceholder = [
    value.authors.join("; "),
    value.translator ? `（${value.translator} 译）` : "",
  ]
    .filter(Boolean)
    .join("");

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="title_main"
          label="书名"
          required
          invalid={titleInvalid}
          placeholder="主标题"
          value={value.title_main}
          onChange={set("title_main")}
          disabled={disabled}
        />
        <TextField
          id="title_sub"
          label="副标题"
          placeholder="可选"
          value={value.title_sub}
          onChange={set("title_sub")}
          disabled={disabled}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="authors">作者</Label>
        {/* The wrapper forwards clicks to the real input; keyboard users focus the input directly. */}
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div
          className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-sm border border-input px-2 py-1 focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/50 dark:bg-input/30"
          onClick={() => document.getElementById("authors")?.focus()}
        >
          {value.authors.map((name) => (
            <span
              key={name}
              className="inline-flex h-6 items-center gap-1 rounded-full border border-tone-violet/20 bg-tone-violet/10 pr-0.5 pl-2.5 text-xs text-tone-violet"
            >
              {name}
              <button
                type="button"
                disabled={disabled}
                onClick={() =>
                  set("authors")(value.authors.filter((a) => a !== name))
                }
                aria-label={`移除作者 ${name}`}
                className="grid size-5 place-items-center rounded-full hover:bg-tone-violet/15"
              >
                <XIcon className="size-3" aria-hidden />
              </button>
            </span>
          ))}
          <input
            id="authors"
            value={authorDraft}
            disabled={disabled}
            maxLength={200}
            onChange={(e) => setAuthorDraft(e.target.value)}
            onKeyDown={onAuthorKey}
            onBlur={pushAuthor}
            placeholder={value.authors.length ? "" : "输入后按回车或逗号添加"}
            aria-describedby="authors-hint"
            className="h-7 min-w-32 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground focus-visible:outline-none"
          />
        </div>
        <p id="authors-hint" className="text-xs text-faint">
          可添加多位作者；按退格删除最后一位。
        </p>
      </div>

      <TextField
        id="translator"
        label="译者"
        placeholder="可选"
        value={value.translator}
        onChange={set("translator")}
        disabled={disabled}
      />

      <div className="grid gap-5 border-t pt-5 sm:grid-cols-3">
        <TextField
          id="header_left"
          label="左页眉"
          maxLength={100}
          placeholder={value.title_main || "默认使用书名"}
          value={value.header_left}
          onChange={set("header_left")}
          disabled={disabled}
        />
        <TextField
          id="pdf_title"
          label="PDF 标题"
          placeholder={pdfTitlePlaceholder || "默认由书名生成"}
          value={value.pdf_title}
          onChange={set("pdf_title")}
          disabled={disabled}
        />
        <TextField
          id="pdf_author"
          label="PDF 作者"
          placeholder={pdfAuthorPlaceholder || "默认由作者生成"}
          value={value.pdf_author}
          onChange={set("pdf_author")}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
