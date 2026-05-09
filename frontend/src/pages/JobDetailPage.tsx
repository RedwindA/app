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

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading, error } = useJob(id);
  const qc = useQueryClient();

  if (isLoading) return <div className="container"><div className="muted">Loading…</div></div>;
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
    if (!confirm('Delete this job and all its files?')) return;
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>{job.metadata.title_main || job.source_pdf_name}</h2>
        <Link to="/" className="btn small secondary" style={{ textDecoration: 'none' }}>← Back</Link>
      </div>
      <p className="muted" style={{ marginTop: 0 }}>
        Created {formatDate(job.created_at)} · {job.source_pdf_name} · {job.source_pages ?? '?'} pages
      </p>

      <div className="panel">
        <JobProgress job={job} />
        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {!isTerminal && !job.cancel_requested && (
            <button className="btn small secondary" onClick={onCancel}>Cancel</button>
          )}
          {job.cancel_requested && !isTerminal && <span className="muted">Cancellation requested…</span>}
          {job.state === 'done' && (
            <button className="btn small" onClick={onDownload}>Download PDF</button>
          )}
          <button className="btn small danger" onClick={onDelete}>Delete</button>
        </div>
      </div>

      {job.state === 'done' && id && (
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Preview</h3>
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
