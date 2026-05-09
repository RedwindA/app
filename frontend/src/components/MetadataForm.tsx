import { KeyboardEvent, useEffect, useState } from 'react';
import { z } from 'zod';
import { JobMetadata } from '../api/client';

interface Props {
  initial: Partial<JobMetadata>;
  filename?: string | null;
  onSubmit: (meta: JobMetadata) => void;
  busy?: boolean;
}

const Schema = z.object({
  title_main: z.string().min(1, 'Title is required').max(200),
  title_sub: z.string().max(200).optional().default(''),
  authors: z.array(z.string().min(1)).max(20).optional().default([]),
  translator: z.string().max(200).optional().default(''),
  header_left: z.string().max(100).optional().default(''),
  pdf_title: z.string().max(200).optional().default(''),
  pdf_author: z.string().max(200).optional().default(''),
});

function defaultTitleFromFilename(name: string | null | undefined): string {
  if (!name) return '';
  return name.replace(/\.[Pp][Dd][Ff]$/, '').replace(/[._-]+/g, ' ').trim();
}

export default function MetadataForm({ initial, filename, onSubmit, busy }: Props) {
  const [titleMain, setTitleMain] = useState(initial.title_main ?? defaultTitleFromFilename(filename));
  const [titleSub, setTitleSub] = useState(initial.title_sub ?? '');
  const [authors, setAuthors] = useState<string[]>(initial.authors ?? []);
  const [authorDraft, setAuthorDraft] = useState('');
  const [translator, setTranslator] = useState(initial.translator ?? '');
  const [headerLeft, setHeaderLeft] = useState(initial.header_left ?? '');
  const [pdfTitle, setPdfTitle] = useState(initial.pdf_title ?? '');
  const [pdfAuthor, setPdfAuthor] = useState(initial.pdf_author ?? '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!titleMain && filename) setTitleMain(defaultTitleFromFilename(filename));
  }, [filename]); // eslint-disable-line react-hooks/exhaustive-deps

  function pushAuthor() {
    const v = authorDraft.trim();
    if (!v) return;
    if (authors.includes(v)) { setAuthorDraft(''); return; }
    setAuthors([...authors, v]);
    setAuthorDraft('');
  }
  function onAuthorKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      pushAuthor();
    } else if (e.key === 'Backspace' && !authorDraft && authors.length) {
      setAuthors(authors.slice(0, -1));
    }
  }

  function submit() {
    const result = Schema.safeParse({
      title_main: titleMain.trim(),
      title_sub: titleSub.trim(),
      authors,
      translator: translator.trim(),
      header_left: headerLeft.trim(),
      pdf_title: pdfTitle.trim(),
      pdf_author: pdfAuthor.trim(),
    });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Invalid metadata');
      return;
    }
    setError(null);
    onSubmit(result.data as JobMetadata);
  }

  const pdfTitlePlaceholder = titleSub ? `${titleMain}：${titleSub}` : titleMain;
  const pdfAuthorPlaceholder = [authors.join('; '), translator ? `（${translator} 译）` : ''].filter(Boolean).join('');

  return (
    <div>
      <label htmlFor="title_main">Title *</label>
      <input id="title_main" className="input" value={titleMain} onChange={(e) => setTitleMain(e.target.value)} placeholder="主标题" />

      <label htmlFor="title_sub">Subtitle</label>
      <input id="title_sub" className="input" value={titleSub} onChange={(e) => setTitleSub(e.target.value)} placeholder="副标题（可选）" />

      <label>Authors</label>
      <div className="chip-input">
        {authors.map((a) => (
          <span className="chip" key={a}>
            {a}
            <button type="button" onClick={() => setAuthors(authors.filter((x) => x !== a))} aria-label={`remove ${a}`}>×</button>
          </span>
        ))}
        <input
          value={authorDraft}
          onChange={(e) => setAuthorDraft(e.target.value)}
          onKeyDown={onAuthorKey}
          onBlur={pushAuthor}
          placeholder="Press Enter or , to add"
        />
      </div>

      <label htmlFor="translator">Translator</label>
      <input id="translator" className="input" value={translator} onChange={(e) => setTranslator(e.target.value)} placeholder="译者（可选）" />

      <div className="row">
        <div>
          <label htmlFor="header_left">Header (left)</label>
          <input id="header_left" className="input" value={headerLeft} onChange={(e) => setHeaderLeft(e.target.value)} placeholder={titleMain || 'page header'} />
        </div>
        <div>
          <label htmlFor="pdf_title">PDF /Title</label>
          <input id="pdf_title" className="input" value={pdfTitle} onChange={(e) => setPdfTitle(e.target.value)} placeholder={pdfTitlePlaceholder} />
        </div>
        <div>
          <label htmlFor="pdf_author">PDF /Author</label>
          <input id="pdf_author" className="input" value={pdfAuthor} onChange={(e) => setPdfAuthor(e.target.value)} placeholder={pdfAuthorPlaceholder} />
        </div>
      </div>

      {error && <div className="error mt">{error}</div>}
      <div className="actions">
        <button className="btn" onClick={submit} disabled={busy}>{busy ? 'Submitting…' : 'Start job'}</button>
      </div>
    </div>
  );
}
