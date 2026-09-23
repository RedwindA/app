import type { Job } from "@/api/client";
import { StatusChip } from "@/components/primitives";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isTerminal, stateMeta } from "@/lib/jobs";

export function JobProgress({ job }: { job: Job }) {
  const meta = stateMeta[job.state];
  const files = job.mineru_state?.files ?? [];
  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <StatusChip label={meta.label} color={meta.color} />
        <span className="text-[13px] font-medium">{meta.stage}</span>
        {job.stage_detail && (
          <span className="min-w-0 truncate text-xs text-muted-foreground">
            {job.stage_detail}
          </span>
        )}
        <span className="ml-auto font-mono text-[13px] tabular-nums">
          {job.state === "failed" ? "—" : `${job.progress}%`}
        </span>
      </div>
      {job.state !== "failed" && (
        <Progress
          label="任务进度"
          value={job.progress}
          className="mt-3"
          aria-valuetext={`${meta.stage} ${job.progress}%`}
        />
      )}
      {job.cancel_requested && !isTerminal(job) && (
        <p role="status" className="mt-3 text-xs text-status-planned">
          已请求取消，等待当前步骤结束…
        </p>
      )}
      {job.state === "mineru_processing" && files.length > 0 && (
        <Table className="mt-6 text-[13px]">
          <caption className="pb-2 text-left text-xs text-faint">
            分块识别进度
          </caption>
          <TableHeader>
            <TableRow>
              <TableHead>分块</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">页数</TableHead>
              <TableHead>备注</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((f) => (
              <TableRow key={f.file_name}>
                <TableCell className="font-mono text-xs">
                  {f.file_name}
                </TableCell>
                <TableCell>{f.state}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {f.extracted_pages}/{f.total_pages || "?"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {f.err_msg ?? ""}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
