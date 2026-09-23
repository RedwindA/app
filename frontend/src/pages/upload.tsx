import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { createJob, errorMessage } from "@/api/client";
import { DropZone } from "@/components/job/drop-zone";
import {
  emptyMetadata,
  finalizeMetadata,
  MetadataForm,
  type MetadataDraft,
} from "@/components/job/metadata-form";
import { Eyebrow } from "@/components/primitives";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Panel } from "@/layouts/panel";
import { titleFromFilename } from "@/lib/jobs";

export function Upload() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<MetadataDraft>(emptyMetadata);
  const [uploaded, setUploaded] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [titleInvalid, setTitleInvalid] = useState(false);
  const busy = uploaded !== null;

  function onFile(next: File | null) {
    setFile(next);
    setError(null);
    // Suggest a title from the filename until the user types their own.
    if (next && !metadata.title_main.trim())
      setMetadata({ ...metadata, title_main: titleFromFilename(next.name) });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setError("请先选择一个 PDF 文件。");
      return;
    }
    const result = finalizeMetadata(metadata);
    if (!result.ok) {
      setTitleInvalid(true);
      setError(result.error);
      document.getElementById("title_main")?.focus();
      return;
    }
    setTitleInvalid(false);
    setError(null);
    setUploaded(0);
    try {
      const { job_id } = await createJob(file, result.value, setUploaded);
      void qc.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("任务已创建");
      await navigate({ to: "/jobs/$jobId", params: { jobId: job_id } });
    } catch (err) {
      setError(errorMessage(err, "上传失败"));
      setUploaded(null);
    }
  }

  return (
    <Panel
      title="新建任务"
      actions={
        <Link
          to="/"
          className={buttonVariants({ size: "sm", variant: "ghost" })}
        >
          <ArrowLeftIcon />
          返回
        </Link>
      }
    >
      <form
        onSubmit={onSubmit}
        noValidate
        className="mx-auto max-w-3xl p-5 sm:p-8 lg:p-10"
      >
        <Eyebrow>Step 1 / 源文件</Eyebrow>
        <h2 className="mt-3 mb-5 text-xl font-semibold">选择扫描版 PDF</h2>
        <DropZone
          file={file}
          onFile={onFile}
          onReject={() => setError("只能上传单个 PDF 文件。")}
          disabled={busy}
        />

        <div className="mt-10 border-t pt-8">
          <Eyebrow>Step 2 / 书籍信息</Eyebrow>
          <h2 className="mt-3 mb-1 text-xl font-semibold">填写元数据</h2>
          <p className="mb-6 text-[13px] leading-6 text-muted-foreground">
            用于封面、页眉和 PDF 文档属性；留空的项使用占位符中的默认值。
          </p>
          <MetadataForm
            value={metadata}
            onChange={(next) => {
              setMetadata(next);
              if (next.title_main.trim()) setTitleInvalid(false);
            }}
            titleInvalid={titleInvalid}
            disabled={busy}
          />
        </div>

        {error && <Alert variant="error" title={error} className="mt-8" />}

        <div className="mt-8 flex flex-wrap items-center gap-4 border-t pt-6">
          <Button type="submit" arrow disabled={busy}>
            {busy ? "正在上传…" : "开始转换"}
          </Button>
          {uploaded !== null && (
            <div className="flex min-w-48 flex-1 items-center gap-3">
              <Progress
                label="上传进度"
                value={uploaded * 100}
                className="flex-1"
              />
              <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                {uploaded >= 1 ? "处理中…" : `${Math.round(uploaded * 100)}%`}
              </span>
            </div>
          )}
        </div>
      </form>
    </Panel>
  );
}
