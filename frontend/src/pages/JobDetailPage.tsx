import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { cancelJob, deleteJob, downloadPdf } from '../api/client';
import { useJob } from '../hooks/useJob';
import JobProgress from '../components/JobProgress';
import PdfPreview from '../components/PdfPreview';
import ErrorPanel from '../components/ErrorPanel';

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleString();
}

function JobDetailSkeleton() {
  return (
    <div className="container" aria-hidden="true" aria-busy="true">
      <div className="page-head">
        <span className="skeleton text med" style={{ height: 26 }} />
        <span className="skeleton" style={{ width: 80, height: 30, borderRadius: 6 }} />
      </div>
      <span className="skeleton text short mt" />
      <div className="spacer" />
      <span className="skeleton row" style={{ height: 120 }} />
    </div>
  );
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading, error } = useJob(id);
  const qc = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) return <JobDetailSkeleton />;
  if (error) return <div className="container"><div className="error">{(error as Error).message}</div></div>;
  if (!job) return <div className="container"><div className="muted">No job.</div></div>;

  const isTerminal = job.state === 'done' || job.state === 'failed';

  async function onCancel() {
    if (!id) return;
    await cancelJob(id);
    qc.invalidateQueries({ queryKey: ['job', id] });
  }
  async function onDelete() {
    if (!id) return;
    await deleteJob(id);
    qc.invalidateQueries({ queryKey: ['jobs'] });
    window.location.href = '/';
  }
  async function onDownload() {
    if (!id || !job) return;
    const safe = job.metadata.title_main.replace(/[^\p{L}\p{N}._-]+/gu, '_').replace(/^_+|_+$/g, '') || 'book';
    await downloadPdf(id, `${safe}.pdf`);
  }

  return (
    <div className="container">
      <div className="page-head">
        <h2>{job.metadata.title_main || job.source_pdf_name}</h2>
        <Link to="/" className="btn small secondary">← Back</Link>
      </div>
      <p className="page-meta">
        Created {formatDate(job.created_at)} · {job.source_pdf_name} · {job.source_pages ?? '?'} pages
      </p>

      <div className="panel">
        <JobProgress job={job} />
        <div className="actions">
          {!isTerminal && !job.cancel_requested && (
            <button className="btn small secondary" onClick={onCancel}>Cancel</button>
          )}
          {job.cancel_requested && !isTerminal && <span className="muted">Cancellation requested…</span>}
          {job.state === 'done' && (
            <button className="btn small" onClick={onDownload}>
              <svg className="btn-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M8 3v8M4 7l4 4 4-4M3 13h10" />
              </svg>
              Download PDF
            </button>
          )}
          {!confirmDelete ? (
            <button className="btn small danger" onClick={() => setConfirmDelete(true)}>Delete</button>
          ) : (
            <span className="confirm-inline">
              <span>Delete this job and all files?</span>
              <button className="btn small danger" onClick={onDelete}>Delete</button>
              <button className="btn small ghost" onClick={() => setConfirmDelete(false)}>Cancel</button>
            </span>
          )}
        </div>
      </div>

      {job.state === 'done' && id && (
        <div className="panel">
          <h3 className="panel-title">Preview</h3>
          <PdfPreview jobId={id} />
        </div>
      )}

      {job.state === 'failed' && (
        <div className="panel">
          <ErrorPanel job={job} />
        </div>
      )}
    </div>
  );
}
