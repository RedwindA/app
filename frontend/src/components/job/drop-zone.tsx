import { useDropzone } from "react-dropzone";
import { FilePdfIcon, UploadSimpleIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { formatMb } from "@/lib/jobs";
import { cn } from "@/lib/utils";

const SOFT_WARN_BYTES = 200 * 1024 * 1024;

export function DropZone({
  file,
  onFile,
  onReject,
  disabled,
}: {
  file: File | null;
  onFile: (file: File | null) => void;
  onReject?: () => void;
  disabled?: boolean;
}) {
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    multiple: false,
    disabled,
    noClick: !!file,
    noKeyboard: !!file,
    onDropAccepted: (files) => onFile(files[0] ?? null),
    onDropRejected: onReject,
  });

  if (file) {
    return (
      <div
        {...getRootProps({
          className: cn(
            "flex items-center gap-3 rounded-xl border p-4 transition-colors",
            isDragActive && "border-link bg-link/5",
          ),
        })}
      >
        <input {...getInputProps()} aria-label="替换 PDF 文件" />
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-tone-teal/10 text-tone-teal">
          <FilePdfIcon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold">{file.name}</div>
          <div className="mt-0.5 font-mono text-[11px] text-faint">
            {formatMb(file.size)}
          </div>
          {file.size > SOFT_WARN_BYTES && (
            <p className="mt-1 text-xs text-status-planned">
              文件较大（{formatMb(file.size, 0)}），上传和 OCR 需要较长时间。
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={open}
          disabled={disabled}
        >
          替换
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="移除文件"
          onClick={() => onFile(null)}
          disabled={disabled}
        >
          <XIcon aria-hidden />
        </Button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps({
        className: cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-input px-6 py-12 text-center transition-colors outline-none hover:bg-accent/40 focus-visible:border-ring",
          isDragActive && "border-link bg-link/5",
        ),
        role: "button",
        "aria-label": "选择或拖入 PDF 文件",
      })}
    >
      <input {...getInputProps()} />
      <span
        className={cn(
          "grid size-10 place-items-center rounded-lg bg-muted text-muted-foreground transition-colors",
          isDragActive && "bg-link/10 text-link",
        )}
      >
        <UploadSimpleIcon className="size-5" aria-hidden />
      </span>
      <div>
        <div className="text-[13px] font-semibold">
          {isDragActive ? "松开以上传 PDF" : "把扫描版 PDF 拖到这里"}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          或点击选择文件 · 仅支持 PDF
        </div>
      </div>
    </div>
  );
}
