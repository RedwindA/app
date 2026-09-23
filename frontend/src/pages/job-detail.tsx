import { lazy, Suspense, useState } from "react";
import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  DownloadSimpleIcon,
  StopIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { downloadPdf, errorMessage, errorStatus, type Job } from "@/api/client";
import { DeleteJobButton } from "@/components/job/delete-job-button";
import { FailurePanel } from "@/components/job/failure-panel";
import { JobProgress } from "@/components/job/job-progress";
import { Eyebrow } from "@/components/primitives";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCancelJob,
  useDeleteJob,
  useJob,
  useJobLog,
  usePreviewUrl,
  useRebuildJob,
} from "@/data/jobs";
import { Panel } from "@/layouts/panel";
import { formatDate, isTerminal, jobTitle, pdfFileName } from "@/lib/jobs";

const routeApi = getRouteApi("/app/jobs/$jobId");

// pdf.js is large; load it only for finished jobs.
const PdfPreview = lazy(() =>
  import("@/components/job/pdf-preview").then((m) => ({
    default: m.PdfPreview,
  })),
);

const backButton = (
  <Link to="/" className={buttonVariants({ size: "sm", variant: "ghost" })}>
    <ArrowLeftIcon />
    返回
  </Link>
);

export function JobDetail() {
  const { jobId } = routeApi.useParams();
  const { data: job, isPending, error } = useJob(jobId);

  if (isPending)
    return (
      <Panel title="任务详情" actions={backButton}>
        <div
          role="status"
          aria-label="正在加载任务"
          className="mx-auto max-w-4xl space-y-4 p-5 sm:p-8 lg:p-10"
        >
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="mt-8 h-24 w-full" />
        </div>
      </Panel>
    );

  if (error)
    return (
      <Panel title="任务详情" actions={backButton}>
        <div className="mx-auto max-w-4xl p-5 sm:p-8 lg:p-10">
          <Alert
            variant="error"
            title={errorStatus(error) === 404 ? "任务不存在" : "任务加载失败"}
          >
            {errorStatus(error) === 404
              ? "这个任务可能已被删除。"
              : errorMessage(error)}
          </Alert>
        </div>
      </Panel>
    );

  return <JobView job={job} />;
}

function JobView({ job }: { job: Job }) {
  const navigate = useNavigate();
  const cancel = useCancelJob();
  const remove = useDeleteJob();
  const rebuild = useRebuildJob();
  const [logRequested, setLogRequested] = useState(false);
  const log = useJobLog(job.id, job.state === "failed" && logRequested);
  const title = jobTitle(job);
  const running = !isTerminal(job);

  async function onDownload() {
    try {
      await downloadPdf(job.id, pdfFileName(job));
    } catch (err) {
      toast.error(`下载失败：${errorMessage(err)}`);
    }
  }

  const m = job.metadata;
  const details = [
    ["源文件", job.source_pdf_name],
    ["页数", job.source_pages ? `${job.source_pages} 页` : null],
    ["作者", m.authors?.length ? m.authors.join("、") : null],
    ["译者", m.translator],
    ["创建时间", formatDate(job.created_at)],
    ["更新时间", formatDate(job.updated_at)],
  ].filter((entry): entry is [string, string] => !!entry[1]);

  return (
    <Panel
      title="任务详情"
      actions={
        <>
          {backButton}
          {running && !job.cancel_requested && (
            <Button
              size="sm"
              variant="secondary"
              disabled={cancel.isPending}
              onClick={() =>
                cancel.mutate(job.id, {
                  onError: (err) =>
                    toast.error(`取消失败：${errorMessage(err)}`),
                })
              }
            >
              <StopIcon aria-hidden />
              取消任务
            </Button>
          )}
          {job.state === "done" && (
            <Button size="sm" onClick={() => void onDownload()}>
              <DownloadSimpleIcon aria-hidden />
              下载 PDF
            </Button>
          )}
          <DeleteJobButton
            title={title}
            disabled={remove.isPending}
            onConfirm={() =>
              remove.mutate(job.id, {
                onSuccess: () => {
                  toast.success("任务已删除");
                  void navigate({ to: "/" });
                },
                onError: (err) => toast.error(`删除失败：${errorMessage(err)}`),
              })
            }
          />
        </>
      }
    >
      <div className="mx-auto max-w-4xl p-5 sm:p-8 lg:p-10">
        <Eyebrow>Job / {job.id.slice(0, 8)}</Eyebrow>
        <h2 className="mt-3 text-2xl font-semibold break-words">{title}</h2>
        {m.title_sub && (
          <p className="mt-1 text-[15px] text-muted-foreground">
            {m.title_sub}
          </p>
        )}
        <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-[auto_1fr_auto_1fr]">
          {details.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="font-mono text-[11px] leading-5 text-faint">
                {label}
              </dt>
              <dd className="min-w-0 truncate leading-5">{value}</dd>
            </div>
          ))}
        </dl>

        <section
          aria-labelledby="progress-heading"
          className="mt-8 border-t pt-6"
        >
          <h3 id="progress-heading" className="sr-only">
            进度
          </h3>
          <JobProgress job={job} />
        </section>

        {job.state === "failed" && (
          <section className="mt-8 border-t pt-6">
            <FailurePanel
              error={job.error}
              log={log.data}
              logLoading={log.isFetching}
              logError={log.isError}
              onLogOpen={() => setLogRequested(true)}
              rebuilding={rebuild.isPending}
              rebuildError={
                rebuild.error
                  ? errorMessage(rebuild.error, "重新构建失败")
                  : null
              }
              onRebuild={() => rebuild.mutate(job.id)}
            />
          </section>
        )}

        {job.state === "done" && (
          <section
            aria-labelledby="preview-heading"
            className="mt-8 border-t pt-6"
          >
            <h3 id="preview-heading" className="mb-4 text-sm font-semibold">
              预览
            </h3>
            <Preview jobId={job.id} version={job.updated_at} />
          </section>
        )}
      </div>
    </Panel>
  );
}

function Preview({ jobId, version }: { jobId: string; version: number }) {
  const preview = usePreviewUrl(jobId, version);
  return (
    <Suspense
      fallback={
        <Skeleton className="mx-auto aspect-[1/1.414] w-full max-w-[760px]" />
      }
    >
      <PdfPreview
        url={preview.status === "ready" ? preview.url : null}
        loading={preview.status === "loading"}
        error={preview.status === "error" ? errorMessage(preview.error) : null}
      />
    </Suspense>
  );
}
