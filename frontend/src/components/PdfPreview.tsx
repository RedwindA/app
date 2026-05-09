import { useEffect, useMemo, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { fetchPreviewBlob } from '../api/client';

// react-pdf needs the worker URL set once. Use the bundled ESM worker.
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Vite-friendly worker bind.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

// CMaps + standard fonts are copied into the served public path by
// vite-plugin-static-copy. Required for CJK / CID-keyed font rendering.
const PDFJS_OPTIONS = {
  cMapUrl: '/pdfjs/cmaps/',
  cMapPacked: true,
  standardFontDataUrl: '/pdfjs/standard_fonts/',
};

export default function PdfPreview({ jobId }: { jobId: string }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let url: string | null = null;
    fetchPreviewBlob(jobId)
      .then((u) => {
        if (!active) { URL.revokeObjectURL(u); return; }
        url = u;
        setBlobUrl(u);
      })
      .catch((e) => active && setError(String(e)));
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [jobId]);

  // Memoize the file descriptor; passing a fresh object each render makes
  // react-pdf reload the document and flicker.
  const file = useMemo(() => (blobUrl ? { url: blobUrl } : null), [blobUrl]);

  if (error) return <div className="error">Preview failed: {error}</div>;
  if (!file) return <div className="muted">Loading preview…</div>;

  return (
    <div className="pdf-shell">
      <Document
        file={file}
        options={PDFJS_OPTIONS}
        onLoadSuccess={(d) => { setPages(d.numPages); setPage(1); }}
        loading={<span className="muted">Rendering…</span>}
      >
        <Page pageNumber={page} width={760} renderTextLayer={false} renderAnnotationLayer={false} />
      </Document>
      <div className="pdf-pager">
        <button className="btn small secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹ Prev</button>
        <span>{page} / {pages || '…'}</span>
        <button className="btn small secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next ›</button>
      </div>
    </div>
  );
}
