import axios, { AxiosInstance, AxiosError } from 'axios';

const TOKEN_KEY = 'latex-app-token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

let onUnauthorized: (() => void) | null = null;
export function setOnUnauthorized(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

export const api: AxiosInstance = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (resp) => resp,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearToken();
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

export type JobState =
  | 'queued'
  | 'splitting'
  | 'mineru_uploading'
  | 'mineru_processing'
  | 'mineru_downloading'
  | 'latex_merging'
  | 'latex_compiling'
  | 'done'
  | 'failed';

export const TERMINAL_STATES: JobState[] = ['done', 'failed'];

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

export async function login(password: string): Promise<{ access_token: string; expires_in: number }> {
  const r = await api.post('/login', { password });
  return r.data;
}

export async function probe(): Promise<{ subject: string }> {
  const r = await api.get('/me');
  return r.data;
}

export async function listJobs(): Promise<Job[]> {
  const r = await api.get('/jobs');
  return r.data;
}

export async function getJob(id: string): Promise<Job> {
  const r = await api.get(`/jobs/${id}`);
  return r.data;
}

export async function createJob(file: File, metadata: JobMetadata): Promise<{ job_id: string; state: JobState; source_pages: number }> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('metadata', JSON.stringify(metadata));
  const r = await api.post('/jobs', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  return r.data;
}

export async function cancelJob(id: string): Promise<void> {
  await api.post(`/jobs/${id}/cancel`);
}

export async function rebuildJob(id: string): Promise<{ ok: boolean; cached_zips: number }> {
  const r = await api.post(`/jobs/${id}/rebuild`);
  return r.data;
}

export async function deleteJob(id: string): Promise<void> {
  await api.delete(`/jobs/${id}`);
}

export async function fetchPreviewBlob(id: string): Promise<string> {
  const r = await api.get(`/jobs/${id}/preview`, { responseType: 'blob' });
  return URL.createObjectURL(r.data);
}

export function downloadPdfUrl(id: string): string {
  // Browsers can't add Authorization to plain <a download>, so we provide a fetch helper instead.
  return `/api/jobs/${id}/pdf`;
}

export async function downloadPdf(id: string, suggestedName = 'book.pdf'): Promise<void> {
  const r = await api.get(`/jobs/${id}/pdf`, { responseType: 'blob' });
  const url = URL.createObjectURL(r.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = suggestedName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function fetchLog(id: string): Promise<string> {
  const r = await api.get(`/jobs/${id}/log`, { responseType: 'text' });
  return r.data;
}
