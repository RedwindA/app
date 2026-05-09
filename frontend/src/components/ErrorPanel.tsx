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
      <h3 style={{ color: 'var(--err)' }}>Job failed</h3>
      <div className="error" style={{ marginBottom: 12 }}>{job.error ?? '(no error message)'}</div>
      <div style={{ marginBottom: 12 }}>
        <button className="btn small" onClick={onRebuild} disabled={rebuildBusy}>
          {rebuildBusy ? 'Rebuilding…' : 'Retry build (skip MinerU)'}
        </button>
        {rebuildErr && <div className="error" style={{ marginTop: 8 }}>{rebuildErr}</div>}
        <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
          Re-runs only the LaTeX merge + compile from the cached MinerU zips. Use after a builder fix.
        </div>
      </div>
      {log && (
        <details>
          <summary className="muted" style={{ cursor: 'pointer' }}>latexmk log (last lines)</summary>
          <pre className="error" style={{ maxHeight: 320, overflow: 'auto' }}>{log.slice(-12000)}</pre>
        </details>
      )}
      {err && <div className="muted">No latexmk log available ({err}).</div>}
    </div>
  );
}
