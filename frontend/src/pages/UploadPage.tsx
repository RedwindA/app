import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DropZone from '../components/DropZone';
import MetadataForm from '../components/MetadataForm';
import { JobMetadata, createJob } from '../api/client';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function onSubmit(meta: JobMetadata) {
    if (!file) {
      setError('Pick a PDF first.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const { job_id } = await createJob(file, meta);
      navigate(`/jobs/${job_id}`);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : err?.message ?? 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="page-head">
        <h2>New upload</h2>
        <Link to="/" className="btn small secondary">← Back</Link>
      </div>
      <div className="panel">
        <DropZone file={file} onFile={setFile} />
      </div>
      <div className="panel">
        <MetadataForm initial={{}} filename={file?.name ?? null} onSubmit={onSubmit} busy={busy} />
        {error && <div className="error mt">{error}</div>}
      </div>
    </div>
  );
}
