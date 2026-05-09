import { useDropzone } from 'react-dropzone';

interface Props {
  file: File | null;
  onFile: (f: File | null) => void;
}

const SOFT_WARN_BYTES = 200 * 1024 * 1024;

export default function DropZone({ file, onFile }: Props) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    onDropAccepted: (files) => onFile(files[0]),
  });

  return (
    <div>
      <div {...getRootProps({ className: 'dropzone ' + (isDragActive ? 'active' : '') })}>
        <input {...getInputProps()} />
        {file ? (
          <div>
            <strong>{file.name}</strong>
            <div className="hint">{(file.size / 1024 / 1024).toFixed(1)} MB · click to replace</div>
            {file.size > SOFT_WARN_BYTES && (
              <div className="hint" style={{ color: 'var(--warn)' }}>
                Large file ({(file.size / 1024 / 1024).toFixed(0)} MB). Upload + OCR will take a while.
              </div>
            )}
          </div>
        ) : isDragActive ? (
          <div>Drop the PDF here…</div>
        ) : (
          <div>
            <strong>Drop a scanned PDF here</strong>
            <div className="hint">or click to choose · PDF only</div>
          </div>
        )}
      </div>
    </div>
  );
}
