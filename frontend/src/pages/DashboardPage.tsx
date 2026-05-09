import { Link } from 'react-router-dom';
import { useJobs } from '../hooks/useJob';
import JobList from '../components/JobList';

function JobsSkeleton() {
  return (
    <div aria-hidden="true" aria-busy="true">
      <span className="skeleton row" />
      <span className="skeleton row" />
      <span className="skeleton row" />
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error } = useJobs();

  return (
    <div className="container">
      <div className="page-head">
        <h2>Jobs</h2>
        <Link to="/upload" className="btn">
          <svg className="btn-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M8 3v10M3 8h10" />
          </svg>
          New upload
        </Link>
      </div>
      <div className="panel">
        {isLoading && <JobsSkeleton />}
        {error && <div className="error">{(error as Error).message}</div>}
        {data && <JobList jobs={data} />}
      </div>
    </div>
  );
}
