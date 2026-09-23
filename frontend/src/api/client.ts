import axios, { isAxiosError, type AxiosInstance } from "axios";
import { clearToken, getToken } from "@/auth/token";

export const api: AxiosInstance = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// A 401 anywhere drops the token; the app shell then redirects to /login.
api.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    if (isAxiosError(error) && error.response) {
      if (error.response.status === 401) clearToken();
      // Blob requests (PDF, preview) receive JSON errors as a Blob; decode them
      // so errorMessage() can still read FastAPI's `detail`.
      const data: unknown = error.response.data;
      if (data instanceof Blob && data.type.includes("json")) {
        try {
          error.response.data = JSON.parse(await data.text());
        } catch {
          // Keep the original body.
        }
      }
    }
    return Promise.reject(error);
  },
);

/** Human-readable message from an API error, preferring FastAPI's `detail`. */
export function errorMessage(error: unknown, fallback = "请求失败"): string {
  if (isAxiosError(error)) {
    const detail: unknown = error.response?.data?.detail;
    if (typeof detail === "string" && detail) return detail;
    return error.message || fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function errorStatus(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined;
}

export type JobState =
  | "queued"
  | "splitting"
  | "mineru_uploading"
  | "mineru_processing"
  | "mineru_downloading"
  | "latex_merging"
  | "latex_compiling"
  | "done"
  | "failed";

export const TERMINAL_STATES: readonly JobState[] = ["done", "failed"];

export interface JobMineruFile {
  file_name: string;
  state: string;
  extracted_pages: number;
  total_pages: number;
  err_msg?: string | null;
}

export interface JobMineruState {
  batch_id?: string;
  files?: JobMineruFile[];
  chunks?: { path: string; page_start: number; page_end: number }[];
}

export interface JobMetadata {
  title_main: string;
  title_sub?: string;
  authors?: string[];
  translator?: string;
  header_left?: string;
  pdf_title?: string;
  pdf_author?: string;
}

export interface Job {
  id: string;
  created_at: number;
  updated_at: number;
  state: JobState;
  progress: number;
  stage_detail: string | null;
  metadata: JobMetadata;
  source_pdf_name: string | null;
  source_pages: number | null;
  mineru_state: JobMineruState | null;
  output_pdf_path: string | null;
  error: string | null;
  cancel_requested: boolean;
}

export async function login(
  password: string,
): Promise<{ access_token: string; expires_in: number }> {
  const r = await api.post("/login", { password });
  return r.data;
}

export async function listJobs(): Promise<Job[]> {
  const r = await api.get("/jobs");
  return r.data;
}

export async function getJob(id: string): Promise<Job> {
  const r = await api.get(`/jobs/${id}`);
  return r.data;
}

export async function createJob(
  file: File,
  metadata: JobMetadata,
  onUploadProgress?: (fraction: number) => void,
): Promise<{ job_id: string; state: JobState; source_pages: number }> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("metadata", JSON.stringify(metadata));
  const r = await api.post("/jobs", fd, {
    onUploadProgress: (e) => {
      if (e.total) onUploadProgress?.(e.loaded / e.total);
    },
  });
  return r.data;
}

export async function cancelJob(id: string): Promise<void> {
  await api.post(`/jobs/${id}/cancel`);
}

export async function rebuildJob(
  id: string,
): Promise<{ ok: boolean; cached_zips: number }> {
  const r = await api.post(`/jobs/${id}/rebuild`);
  return r.data;
}

export async function deleteJob(id: string): Promise<void> {
  await api.delete(`/jobs/${id}`);
}

// A 409/410 is heuristically cacheable; always revalidate so a rebuilt PDF shows up.
const NO_CACHE = { "Cache-Control": "no-cache" };

export async function fetchPreviewBlob(
  id: string,
  signal?: AbortSignal,
): Promise<Blob> {
  const r = await api.get(`/jobs/${id}/preview`, {
    responseType: "blob",
    headers: NO_CACHE,
    signal,
  });
  return r.data;
}

// Browsers can't add Authorization to a plain <a download>, so fetch a blob.
export async function downloadPdf(
  id: string,
  suggestedName = "book.pdf",
): Promise<void> {
  const r = await api.get(`/jobs/${id}/pdf`, {
    responseType: "blob",
    headers: NO_CACHE,
  });
  const url = URL.createObjectURL(r.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = suggestedName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function fetchLog(id: string): Promise<string> {
  const r = await api.get(`/jobs/${id}/log`, { responseType: "text" });
  return r.data;
}
