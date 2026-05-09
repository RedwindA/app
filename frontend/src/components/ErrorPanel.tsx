import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Job, fetchLog, rebuildJob } from '../api/client';

export default function ErrorPanel({ job }: { job: Job }) {
  const [log, setLog] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [rebuildBusy, setRebuildBusy] = useState(false);
  const [rebuildErr, setRebuildErr] = useState<string | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    let active = true;
    fetchLog(job.id)
      .then((t) => active && setLog(t))
      .catch((e) => active && setErr(String(e)));
    return () => { active = false; };
  }, [job.id]);

  async function onRebuild() {
    setRebuildErr(null);
    setRebuildBusy(true);
    try {
      await rebuildJob(job.id);
      qc.invalidateQueries({ queryKey: ['job', job.id] });
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      setRebuildErr(typeof detail === 'string' ? detail : e?.message ?? 'Rebuild failed');
    } finally {
      setRebuildBusy(false);
    }
  }

  return (
    <div>
      <h3 className="panel-title" style={{ color: 'var(--err)' }}>Job failed</h3>
      <div className="error">{job.error ?? '(no error message)'}</div>
      <div className="actions">
        <button className="btn small" onClick={onRebuild} disabled={rebuildBusy}>
          {rebuildBusy ? 'Rebuilding…' : 'Retry build (skip MinerU)'}
        </button>
      </div>
      <div className="muted mt-sm" style={{ fontSize: 12 }}>
        Re-runs only the LaTeX merge + compile from the cached MinerU zips. Use after a builder fix.
      </div>
      {rebuildErr && <div className="error mt">{rebuildErr}</div>}
      {log && (
        <details className="mt-lg">
          <summary className="muted" style={{ cursor: 'pointer', userSelect: 'none' }}>
            latexmk log (last lines)
          </summary>
          <pre className="error mt-sm" style={{ maxHeight: 320, overflow: 'auto' }}>{log.slice(-12000)}</pre>
        </details>
      )}
      {err && <div className="muted mt-sm">No latexmk log available ({err}).</div>}
    </div>
  );
}
