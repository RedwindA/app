import { useEffect, useMemo, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { fetchPreviewBlob } from '../api/client';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const PDFJS_OPTIONS = {
  cMapUrl: '/pdfjs/cmaps/',
  cMapPacked: true,
  standardFontDataUrl: '/pdfjs/standard_fonts/',
};

function PreviewSkeleton() {
  return (
    <div className="pdf-shell" aria-hidden="true" aria-busy="true">
      <span className="skeleton canvas" />
      <div className="pdf-pager">
        <span className="skeleton" style={{ width: 60, height: 24, borderRadius: 6 }} />
        <span className="skeleton" style={{ width: 50, height: 12 }} />
        <span className="skeleton" style={{ width: 60, height: 24, borderRadius: 6 }} />
      </div>
    </div>
  );
}

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

  const file = useMemo(() => (blobUrl ? { url: blobUrl } : null), [blobUrl]);

  if (error) return <div className="error">Preview failed: {error}</div>;
  if (!file) return <PreviewSkeleton />;

  return (
    <div className="pdf-shell">
      <Document
        file={file}
        options={PDFJS_OPTIONS}
        onLoadSuccess={(d) => { setPages(d.numPages); setPage(1); }}
        loading={<PreviewSkeleton />}
      >
        <Page pageNumber={page} width={760} renderTextLayer={false} renderAnnotationLayer={false} />
      </Document>
      <div className="pdf-pager">
        <button className="btn small secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹ Prev</button>
        <span className="tabular">{page} / {pages || '…'}</span>
        <button className="btn small secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next ›</button>
      </div>
    </div>
  );
}
