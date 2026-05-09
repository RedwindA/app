import { Link } from 'react-router-dom';
import { useJobs } from '../hooks/useJob';
import JobList from '../components/JobList';

export default function DashboardPage() {
  const { data, isLoading, error } = useJobs();

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Jobs</h2>
        <Link to="/upload" className="btn" style={{ textDecoration: 'none' }}>+ New upload</Link>
      </div>
      <div className="panel">
        {isLoading && <div className="muted">Loading…</div>}
        {error && <div className="error">{(error as Error).message}</div>}
        {data && <JobList jobs={data} />}
      </div>
    </div>
  );
}
