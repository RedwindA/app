import { Job } from '../api/client';

const STAGE_LABEL: Record<string, string> = {
  queued: 'Queued',
  splitting: 'Splitting PDF',
  mineru_uploading: 'Uploading to MinerU',
  mineru_processing: 'MinerU OCR + LaTeX',
  mineru_downloading: 'Downloading results',
  latex_merging: 'Merging LaTeX parts',
  latex_compiling: 'Compiling with XeLaTeX',
  done: 'Done',
  failed: 'Failed',
};

export default function JobProgress({ job }: { job: Job }) {
  const isActive = job.state !== 'done' && job.state !== 'failed';
  const indeterminate = isActive && job.progress > 0 && job.progress < 100;

  return (
    <div>
      <div className="progress-head">
        <div className="meta">
          <span className={`badge ${job.state}`}>{job.state.replace(/_/g, ' ')}</span>
          <span className="stage">{STAGE_LABEL[job.state] ?? job.state}</span>
          {job.stage_detail && <span className="stage-detail">· {job.stage_detail}</span>}
        </div>
        <div className="pct tabular">{job.progress}%</div>
      </div>
      <div className={`progressbar ${indeterminate ? 'indeterminate' : ''}`}>
        <div style={{ width: `${job.progress}%` }} />
      </div>

      {job.state === 'mineru_processing' && job.mineru_state?.files && job.mineru_state.files.length > 0 && (
        <div className="mt-lg">
          <div className="muted mt-sm">Per-chunk progress</div>
          <table className="mineru-table mt-sm">
            <thead>
              <tr><th>Chunk</th><th>State</th><th>Pages</th><th /></tr>
            </thead>
            <tbody>
              {job.mineru_state.files.map((f) => (
                <tr key={f.file_name}>
                  <td>{f.file_name}</td>
                  <td>{f.state}</td>
                  <td className="tabular">{f.extracted_pages}/{f.total_pages || '?'}</td>
                  <td className="muted">{f.err_msg ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
