import { Navigate, Route, Routes, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import JobDetailPage from './pages/JobDetailPage';
import { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function Topbar() {
  const { token, logout } = useAuth();
  const nav = useNavigate();
  if (!token) return null;
  return (
    <div className="topbar">
      <div className="brand">MinerU → LaTeX</div>
      <nav>
        <Link to="/">Dashboard</Link>
        <Link to="/upload">New upload</Link>
        <button className="btn small secondary" onClick={() => { logout(); nav('/login'); }}>Logout</button>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Topbar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
        <Route path="/jobs/:id" element={<ProtectedRoute><JobDetailPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
