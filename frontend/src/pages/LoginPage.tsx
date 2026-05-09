import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (token) return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(password);
      navigate('/', { replace: true });
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 429) setError('Too many attempts — try again in a minute.');
      else if (status === 401) setError('Wrong password.');
      else setError('Login failed: ' + (err?.message ?? 'unknown'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420, marginTop: 80 }}>
      <h1 style={{ marginBottom: 8 }}>MinerU → LaTeX</h1>
      <p className="muted" style={{ marginTop: 0 }}>Single-user web wrapper. Sign in to continue.</p>
      <form className="panel" onSubmit={onSubmit}>
        <label htmlFor="pw">Password</label>
        <input
          id="pw"
          className="input"
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div style={{ marginTop: 16 }}>
          <button className="btn" disabled={busy || !password} type="submit">
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
        {error && <div className="error" style={{ marginTop: 12 }}>{error}</div>}
      </form>
    </div>
  );
}
