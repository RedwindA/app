import { useCallback, useMemo, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// react-pdf requires the worker to be configured in the module that renders it.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

// Served from dist/pdfjs by vite-plugin-static-copy (see vite.config.ts).
const PDFJS_OPTIONS = {
  cMapUrl: "/pdfjs/cmaps/",
  cMapPacked: true,
  standardFontDataUrl: "/pdfjs/standard_fonts/",
  wasmUrl: "/pdfjs/wasm/",
};

function PreviewSkeleton() {
  return (
    <div role="status" aria-label="正在加载预览" className="grid gap-3">
      <Skeleton className="mx-auto aspect-[1/1.414] w-full max-w-[760px]" />
    </div>
  );
}

export function PdfPreview({
  url,
  loading,
  error,
}: {
  url: string | null;
  loading?: boolean;
  error?: string | null;
}) {
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [width, setWidth] = useState(0);
  const file = useMemo(() => (url ? { url } : null), [url]);

  // Fit the page to the available width, capped at print-like 760px.
  const measure = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.min(760, Math.floor(entry.contentRect.width)));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (error)
    return (
      <Alert variant="error" title="预览加载失败">
        {error}
      </Alert>
    );
  if (loading || !file) return <PreviewSkeleton />;

  return (
    <div ref={measure} className="grid gap-4">
      <Document
        file={file}
        options={PDFJS_OPTIONS}
        onLoadSuccess={(doc) => {
          setPages(doc.numPages);
          setPage(1);
        }}
        loading={<PreviewSkeleton />}
        error={<Alert variant="error" title="无法渲染这个 PDF" />}
        className="mx-auto overflow-hidden rounded-lg border bg-white shadow-sm"
      >
        {width > 0 && (
          <Page
            pageNumber={page}
            width={width}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            loading={<PreviewSkeleton />}
          />
        )}
      </Document>
      <nav
        aria-label="预览翻页"
        className="flex items-center justify-center gap-3"
      >
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          <CaretLeftIcon aria-hidden />
          上一页
        </Button>
        <span
          aria-live="polite"
          className="min-w-20 text-center font-mono text-xs text-muted-foreground tabular-nums"
        >
          {page} / {pages || "…"}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= pages}
          onClick={() => setPage((p) => p + 1)}
        >
          下一页
          <CaretRightIcon aria-hidden />
        </Button>
      </nav>
    </div>
  );
}
