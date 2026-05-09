import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
      <h2>New upload</h2>
      <div className="panel">
        <DropZone file={file} onFile={setFile} />
      </div>
      <div className="panel">
        <MetadataForm initial={{}} filename={file?.name ?? null} onSubmit={onSubmit} busy={busy} />
        {error && <div className="error" style={{ marginTop: 12 }}>{error}</div>}
      </div>
    </div>
  );
}
