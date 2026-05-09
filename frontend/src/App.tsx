import { Navigate, Route, Routes, NavLink, useNavigate } from 'react-router-dom';
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
    <header className="topbar" role="banner">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">L</span>
        <span>MinerU → LaTeX</span>
      </div>
      <nav aria-label="Primary">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : undefined)}>Dashboard</NavLink>
        <NavLink to="/upload" className={({ isActive }) => (isActive ? 'active' : undefined)}>New upload</NavLink>
        <span className="topbar-spacer" aria-hidden="true" />
        <button
          className="btn small ghost"
          onClick={() => { logout(); nav('/login'); }}
          aria-label="Sign out"
        >
          Logout
        </button>
      </nav>
    </header>
  );
}

export default function App() {
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <Topbar />
      <main id="main" role="main">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
          <Route path="/jobs/:id" element={<ProtectedRoute><JobDetailPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
