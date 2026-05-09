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

export default function JobList({ jobs }: { jobs: Job[] }) {
  const qc = useQueryClient();

  if (jobs.length === 0) {
    return <p className="muted">No jobs yet. Start one with “New upload”.</p>;
  }

  async function onDelete(j: Job) {
    if (!confirm(`Delete job for “${j.metadata.title_main}”? This removes the PDF and all artifacts.`)) return;
    await deleteJob(j.id);
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
          <th style={{ width: 220 }}>Progress</th>
          <th>Created</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {jobs.map((j) => (
          <tr key={j.id}>
            <td>
              <Link to={`/jobs/${j.id}`} style={{ color: 'var(--text)' }}>
                {j.metadata.title_main || j.source_pdf_name || j.id}
              </Link>
              <div className="muted" style={{ fontSize: 11 }}>
                {j.source_pdf_name} {j.source_pages ? `· ${j.source_pages} p` : ''}
              </div>
            </td>
            <td><span className={`badge ${j.state}`}>{j.state}</span></td>
            <td>
              <div className="progressbar"><div style={{ width: `${j.progress}%` }} /></div>
              <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                {progressLabel(j)} {j.stage_detail ? `· ${j.stage_detail}` : ''}
              </div>
            </td>
            <td className="muted">{formatDate(j.created_at)}</td>
            <td style={{ whiteSpace: 'nowrap' }}>
              <Link to={`/jobs/${j.id}`} className="btn small secondary" style={{ marginRight: 6, textDecoration: 'none' }}>View</Link>
              {j.state === 'done' && (
                <button className="btn small" onClick={() => onDownload(j)} style={{ marginRight: 6 }}>Download</button>
              )}
              <button className="btn small danger" onClick={() => onDelete(j)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
