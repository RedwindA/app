import { getRouteApi, Link } from "@tanstack/react-router";
import {
  DownloadSimpleIcon,
  FilePdfIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { downloadPdf, errorMessage, type Job } from "@/api/client";
import { DeleteJobButton } from "@/components/job/delete-job-button";
import { Eyebrow, StatusChip } from "@/components/primitives";
import { FilterSelect, SearchField, Toolbar } from "@/components/toolbar";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteJob, useJobs } from "@/data/jobs";
import { Panel } from "@/layouts/panel";
import {
  formatDate,
  isTerminal,
  jobTitle,
  pdfFileName,
  stateMeta,
} from "@/lib/jobs";
import { cn } from "@/lib/utils";
import type { jobFilters } from "@/router";

const routeApi = getRouteApi("/app/");

type Filter = (typeof jobFilters)[number];

const filterOptions: { value: Filter; label: string }[] = [
  { value: "active", label: "进行中" },
  { value: "done", label: "已完成" },
  { value: "failed", label: "失败" },
];

function matchesFilter(job: Job, filter: Filter | undefined) {
  if (filter === "active") return !isTerminal(job);
  if (filter) return job.state === filter;
  return true;
}

export function Jobs() {
  const { q = "", state } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const { data: jobs, isPending, error, refetch } = useJobs();
  const remove = useDeleteJob();

  const query = q.trim().toLowerCase();
  const filtered = (jobs ?? []).filter(
    (job) =>
      matchesFilter(job, state) &&
      `${jobTitle(job)} ${job.source_pdf_name ?? ""} ${job.metadata.authors?.join(" ") ?? ""}`
        .toLowerCase()
        .includes(query),
  );

  const stats = [
    ["全部任务", jobs?.length, "text-tone-violet"],
    ["进行中", jobs?.filter((j) => !isTerminal(j)).length, "text-link"],
    [
      "已完成",
      jobs?.filter((j) => j.state === "done").length,
      "text-tone-teal",
    ],
    [
      "失败",
      jobs?.filter((j) => j.state === "failed").length,
      "text-destructive",
    ],
  ] as const;

  async function onDownload(job: Job) {
    try {
      await downloadPdf(job.id, pdfFileName(job));
    } catch (err) {
      toast.error(`下载失败：${errorMessage(err)}`);
    }
  }

  function onDelete(job: Job) {
    remove.mutate(job.id, {
      onSuccess: () => toast.success("任务已删除"),
      onError: (err) => toast.error(`删除失败：${errorMessage(err)}`),
    });
  }

  return (
    <Panel
      title="任务"
      actions={
        <Link to="/upload" className={buttonVariants({ size: "sm" })}>
          <PlusIcon />
          新建任务
        </Link>
      }
    >
      <div className="mx-auto max-w-5xl p-5 sm:p-8 lg:p-10">
        <Eyebrow>MinerU OCR / LaTeX</Eyebrow>
        <h2 className="mt-3 text-2xl font-semibold">转换任务</h2>
        <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
          上传扫描版 PDF，经 MinerU 识别后合并为 LaTeX 并用 XeLaTeX 编译成书。
        </p>

        <div className="mt-8 grid grid-cols-2 gap-y-5 border-y py-5 sm:grid-cols-4 sm:divide-x">
          {stats.map(([label, value, color]) => (
            <div key={label} className="pr-3 sm:px-6 sm:first:pl-0">
              <div className="text-xs text-faint">{label}</div>
              <div className={cn("mt-2 font-mono text-2xl", color)}>
                {value === undefined ? "—" : String(value).padStart(2, "0")}
              </div>
            </div>
          ))}
        </div>

        <Toolbar
          className="mt-9 mb-3"
          search={
            <SearchField
              aria-label="搜索任务"
              placeholder="搜索标题、文件名或作者…"
              value={q}
              onChange={(e) =>
                void navigate({
                  search: (prev) => ({
                    ...prev,
                    q: e.target.value || undefined,
                  }),
                  replace: true,
                })
              }
              onClear={() =>
                void navigate({
                  search: (prev) => ({ ...prev, q: undefined }),
                  replace: true,
                })
              }
            />
          }
        >
          <FilterSelect
            label="按状态筛选"
            allLabel="全部状态"
            value={state ?? ""}
            options={filterOptions}
            onChange={(value) =>
              void navigate({
                search: (prev) => ({
                  ...prev,
                  state: (value || undefined) as Filter | undefined,
                }),
              })
            }
          />
        </Toolbar>

        {isPending ? (
          <div role="status" aria-label="正在加载任务" className="border-t">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4 border-b py-5">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-[22px] w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <Alert variant="error" title="任务列表加载失败">
            {errorMessage(error)}
            <Button
              size="sm"
              variant="secondary"
              className="mt-3 flex"
              onClick={() => void refetch()}
            >
              重试
            </Button>
          </Alert>
        ) : !jobs.length ? (
          <Empty className="border-t">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FilePdfIcon />
              </EmptyMedia>
              <EmptyTitle>还没有任务</EmptyTitle>
              <EmptyDescription>
                上传一份扫描版 PDF，开始 MinerU 识别与 LaTeX 排版。
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link to="/upload" className={buttonVariants()}>
                新建任务
              </Link>
            </EmptyContent>
          </Empty>
        ) : !filtered.length ? (
          <p
            role="status"
            className="border-t py-12 text-center text-sm text-muted-foreground"
          >
            没有匹配的任务，试试其他关键词或状态。
          </p>
        ) : (
          <ItemGroup className="border-b-0">
            {filtered.map((job) => (
              <JobRow
                key={job.id}
                job={job}
                onDownload={() => void onDownload(job)}
                onDelete={() => onDelete(job)}
                deleting={remove.isPending && remove.variables === job.id}
              />
            ))}
          </ItemGroup>
        )}
      </div>
    </Panel>
  );
}

function JobRow({
  job,
  onDownload,
  onDelete,
  deleting,
}: {
  job: Job;
  onDownload: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const meta = stateMeta[job.state];
  const title = jobTitle(job);
  const running = !isTerminal(job);
  return (
    <Item className={cn("py-5", deleting && "opacity-50")}>
      <ItemContent>
        <ItemTitle>
          <Link
            to="/jobs/$jobId"
            params={{ jobId: job.id }}
            className="hover:text-link"
          >
            {title}
          </Link>
        </ItemTitle>
        <ItemDescription className="font-mono text-[11px] text-faint">
          {[
            job.source_pdf_name,
            job.source_pages ? `${job.source_pages} 页` : null,
            formatDate(job.created_at),
          ]
            .filter(Boolean)
            .join(" · ")}
        </ItemDescription>
        {running && (
          <div className="mt-3 flex max-w-md items-center gap-3">
            <Progress
              label={`${title} 进度`}
              value={job.progress}
              className="flex-1"
            />
            <span className="w-10 text-right font-mono text-[11px] text-muted-foreground tabular-nums">
              {job.progress}%
            </span>
          </div>
        )}
        {running && job.stage_detail && (
          <p className="mt-1.5 truncate text-xs text-muted-foreground">
            {job.stage_detail}
          </p>
        )}
        <div className="mt-3 sm:hidden">
          <StatusChip label={meta.label} color={meta.color} />
        </div>
      </ItemContent>
      <div className="hidden sm:block">
        <StatusChip label={meta.label} color={meta.color} />
      </div>
      <ItemActions>
        {job.state === "done" && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`下载「${title}」PDF`}
            title="下载 PDF"
            onClick={onDownload}
          >
            <DownloadSimpleIcon aria-hidden />
          </Button>
        )}
        <DeleteJobButton
          iconOnly
          title={title}
          onConfirm={onDelete}
          disabled={deleting}
        />
      </ItemActions>
    </Item>
  );
}
