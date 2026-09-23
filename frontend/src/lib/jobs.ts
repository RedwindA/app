import type { Job, JobState } from "@/api/client";

const color = {
  queued: "var(--status-closed)",
  active: "var(--status-progress)",
  done: "var(--status-shipped)",
  failed: "var(--destructive)",
};

export const stateMeta: Record<
  JobState,
  { label: string; stage: string; color: string }
> = {
  queued: { label: "排队中", stage: "等待开始", color: color.queued },
  splitting: { label: "拆分中", stage: "拆分 PDF", color: color.active },
  mineru_uploading: {
    label: "上传中",
    stage: "上传到 MinerU",
    color: color.active,
  },
  mineru_processing: {
    label: "识别中",
    stage: "MinerU OCR 与 LaTeX 转换",
    color: color.active,
  },
  mineru_downloading: {
    label: "下载中",
    stage: "下载识别结果",
    color: color.active,
  },
  latex_merging: {
    label: "合并中",
    stage: "合并 LaTeX 分块",
    color: color.active,
  },
  latex_compiling: {
    label: "编译中",
    stage: "XeLaTeX 编译",
    color: color.active,
  },
  done: { label: "已完成", stage: "已完成", color: color.done },
  failed: { label: "失败", stage: "处理失败", color: color.failed },
};

export const isTerminal = (job: Job) =>
  job.state === "done" || job.state === "failed";

export const jobTitle = (job: Job) =>
  job.metadata.title_main || job.source_pdf_name || job.id;

const dateFormat = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "medium",
  timeStyle: "short",
});

export const formatDate = (ts: number) =>
  dateFormat.format(new Date(ts * 1000));

export function pdfFileName(job: Job): string {
  const safe = job.metadata.title_main
    .replace(/[^\p{L}\p{N}._-]+/gu, "_")
    .replace(/^_+|_+$/g, "");
  return `${safe || "book"}.pdf`;
}

export function titleFromFilename(name: string): string {
  return name
    .replace(/\.pdf$/i, "")
    .replace(/[._-]+/g, " ")
    .trim();
}

export const formatMb = (bytes: number, digits = 1) =>
  `${(bytes / 1024 / 1024).toFixed(digits)} MB`;
