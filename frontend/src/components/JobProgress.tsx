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
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <div>
          <span className={`badge ${job.state}`}>{job.state}</span>
          <span style={{ marginLeft: 10, fontWeight: 600 }}>{STAGE_LABEL[job.state] ?? job.state}</span>
          {job.stage_detail && <span className="muted" style={{ marginLeft: 8 }}>· {job.stage_detail}</span>}
        </div>
        <div style={{ fontVariantNumeric: 'tabular-nums' }}>{job.progress}%</div>
      </div>
      <div className="progressbar"><div style={{ width: `${job.progress}%` }} /></div>

      {job.state === 'mineru_processing' && job.mineru_state?.files && job.mineru_state.files.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="muted" style={{ marginBottom: 6 }}>Per-chunk progress</div>
          <table className="mineru-table">
            <thead>
              <tr><th>Chunk</th><th>State</th><th>Pages</th><th></th></tr>
            </thead>
            <tbody>
              {job.mineru_state.files.map((f) => (
                <tr key={f.file_name}>
                  <td>{f.file_name}</td>
                  <td>{f.state}</td>
                  <td>{f.extracted_pages}/{f.total_pages || '?'}</td>
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
