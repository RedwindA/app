import { useEffect, useState } from "react";
import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  cancelJob,
  deleteJob,
  fetchLog,
  fetchPreviewBlob,
  getJob,
  listJobs,
  rebuildJob,
  TERMINAL_STATES,
  type Job,
} from "@/api/client";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000, retry: 1, refetchOnWindowFocus: false },
  },
});

const keys = {
  jobs: ["jobs"] as const,
  job: (id: string) => ["job", id] as const,
  log: (id: string) => ["job", id, "log"] as const,
};

export function useJobs() {
  return useQuery({
    queryKey: keys.jobs,
    queryFn: listJobs,
    // Poll faster while anything is still running.
    refetchInterval: (q) =>
      q.state.data?.some((j) => !TERMINAL_STATES.includes(j.state))
        ? 3000
        : 10000,
  });
}

export function useJob(id: string) {
  return useQuery<Job>({
    queryKey: keys.job(id),
    queryFn: () => getJob(id),
    refetchInterval: (q) => {
      const job = q.state.data;
      return job && TERMINAL_STATES.includes(job.state) ? false : 3000;
    },
  });
}

export function useJobLog(id: string, enabled: boolean) {
  return useQuery({
    queryKey: keys.log(id),
    queryFn: () => fetchLog(id),
    enabled,
    retry: false,
  });
}

function useInvalidateJob() {
  const qc = useQueryClient();
  return (id: string) =>
    Promise.all([
      qc.invalidateQueries({ queryKey: keys.job(id) }),
      qc.invalidateQueries({ queryKey: keys.jobs }),
    ]);
}

export function useCancelJob() {
  const invalidate = useInvalidateJob();
  return useMutation({
    mutationFn: cancelJob,
    onSuccess: (_, id) => invalidate(id),
  });
}

export function useRebuildJob() {
  const invalidate = useInvalidateJob();
  return useMutation({
    mutationFn: rebuildJob,
    onSuccess: (_, id) => invalidate(id),
  });
}

export function useDeleteJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteJob,
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: keys.job(id) });
      qc.setQueryData<Job[]>(keys.jobs, (jobs) =>
        jobs?.filter((j) => j.id !== id),
      );
      return qc.invalidateQueries({ queryKey: keys.jobs });
    },
  });
}

type PreviewState =
  | { status: "loading" }
  | { status: "ready"; url: string }
  | { status: "error"; error: unknown };

/** Object URL of the compiled PDF; revoked on unmount or job change. */
export function usePreviewUrl(id: string, version: number): PreviewState {
  const [state, setState] = useState<PreviewState & { key: string }>({
    status: "loading",
    key: "",
  });
  const key = `${id}:${version}`;

  useEffect(() => {
    const controller = new AbortController();
    let url: string | null = null;
    fetchPreviewBlob(id, controller.signal)
      .then((blob) => {
        url = URL.createObjectURL(blob);
        setState({ status: "ready", url, key });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setState({ status: "error", error, key });
      });
    return () => {
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [id, key]);

  // A stale result from the previous job reads as loading.
  return state.key === key ? state : { status: "loading" };
}
