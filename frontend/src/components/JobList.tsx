import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Job, deleteJob, downloadPdf } from '../api/client';

function formatDate(ts: number) {
  const d = new Date(ts * 1000);
  return d.toLocaleString();
}

function progressLabel(j: Job): string {
  if (j.state === 'done') return '100%';
  if (j.state === 'failed') return '—';
  return `${j.progress}%`;
}

function EmptyState() {
  return (
    <div className="empty">
      <div className="empty-icon" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M9 13h6M9 17h4" />
        </svg>
      </div>
      <h3>No jobs yet</h3>
      <p>Upload a scanned PDF to start the MinerU OCR and LaTeX build pipeline.</p>
      <Link to="/upload" className="btn small">Start a new upload</Link>
    </div>
  );
}

export default function JobList({ jobs }: { jobs: Job[] }) {
  const qc = useQueryClient();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (jobs.length === 0) return <EmptyState />;

  async function onDelete(j: Job) {
    await deleteJob(j.id);
    setConfirmId(null);
    qc.invalidateQueries({ queryKey: ['jobs'] });
  }

  async function onDownload(j: Job) {
    const safe = j.metadata.title_main.replace(/[^\p{L}\p{N}._-]+/gu, '_').replace(/^_+|_+$/g, '') || 'book';
    await downloadPdf(j.id, `${safe}.pdf`);
  }

  return (
    <table className="joblist">
      <thead>
        <tr>
          <th>Title</th>
          <th>State</th>
          <th className="progress-cell">Progress</th>
          <th>Created</th>
          <th aria-label="Actions" />
        </tr>
      </thead>
      <tbody>
        {jobs.map((j) => (
          <tr key={j.id}>
            <td>
              <Link to={`/jobs/${j.id}`} className="row-title">
                {j.metadata.title_main || j.source_pdf_name || j.id}
              </Link>
              <div className="row-sub">
                {j.source_pdf_name} {j.source_pages ? `· ${j.source_pages} p` : ''}
              </div>
            </td>
            <td><span className={`badge ${j.state}`}>{j.state.replace(/_/g, ' ')}</span></td>
            <td className="progress-cell">
              <div className="progressbar"><div style={{ width: `${j.progress}%` }} /></div>
              <div className="meta">
                {progressLabel(j)} {j.stage_detail ? `· ${j.stage_detail}` : ''}
              </div>
            </td>
            <td className="muted tabular">{formatDate(j.created_at)}</td>
            <td>
              <div className="row-actions">
                <Link to={`/jobs/${j.id}`} className="btn small secondary">View</Link>
                {j.state === 'done' && (
                  <button className="btn small" onClick={() => onDownload(j)}>Download</button>
                )}
                {confirmId === j.id ? (
                  <span className="confirm-inline">
                    <span>Delete?</span>
                    <button className="btn small danger" onClick={() => onDelete(j)}>Yes</button>
                    <button className="btn small ghost" onClick={() => setConfirmId(null)}>No</button>
                  </span>
                ) : (
                  <button className="btn small danger" onClick={() => setConfirmId(j.id)}>Delete</button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
