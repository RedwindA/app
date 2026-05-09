import { useDropzone } from 'react-dropzone';

interface Props {
  file: File | null;
  onFile: (f: File | null) => void;
}

const SOFT_WARN_BYTES = 200 * 1024 * 1024;

function UploadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 16V4" />
      <path d="M7 9l5-5 5 5" />
      <path d="M5 16v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

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
            <span className="dz-icon"><FileIcon /></span>
            <div className="dz-title">{file.name}</div>
            <div className="hint">{(file.size / 1024 / 1024).toFixed(1)} MB · click to replace</div>
            {file.size > SOFT_WARN_BYTES && (
              <div className="hint warn">
                Large file ({(file.size / 1024 / 1024).toFixed(0)} MB). Upload + OCR will take a while.
              </div>
            )}
          </div>
        ) : isDragActive ? (
          <div>
            <span className="dz-icon"><UploadIcon /></span>
            <div className="dz-title">Drop the PDF here</div>
          </div>
        ) : (
          <div>
            <span className="dz-icon"><UploadIcon /></span>
            <div className="dz-title">Drop a scanned PDF here</div>
            <div className="hint">or click to choose · PDF only</div>
          </div>
        )}
      </div>
    </div>
  );
}
