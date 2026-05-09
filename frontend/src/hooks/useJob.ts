import { useQuery } from '@tanstack/react-query';
import { getJob, listJobs, Job, TERMINAL_STATES } from '../api/client';

export function useJob(id: string | undefined) {
  return useQuery<Job>({
    queryKey: ['job', id],
    queryFn: () => getJob(id!),
    enabled: !!id,
    refetchInterval: (q) => {
      const data = q.state.data as Job | undefined;
      if (!data) return 3000;
      return TERMINAL_STATES.includes(data.state) ? false : 3000;
    },
  });
}

export function useJobs() {
  return useQuery<Job[]>({
    queryKey: ['jobs'],
    queryFn: listJobs,
    refetchInterval: 10000,
  });
}
