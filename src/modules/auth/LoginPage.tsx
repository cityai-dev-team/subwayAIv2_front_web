// src/modules/auth/LoginPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function LoginPage() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      await login({ email, password }); // ✅ 객체 한 개로 전달
      nav('/');
    } catch (e: any) {
      setErr(e?.message ?? '로그인 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-6 t-main">
      <form onSubmit={onSubmit} className="w-full max-w-sm p-6 rounded-2xl border space-y-4">
        <h1 className="text-xl font-semibold">로그인</h1>
        {err && <div className="text-red-600 text-sm">{err}</div>}

        <div className="space-y-1">
          <label className="text-sm">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 h-10"
            type="email"
            autoComplete="username"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm">Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 h-10"
            type="password"
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          className="w-full h-10 rounded bg-indigo-600 text-white disabled:opacity-50"
          disabled={loading}
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </div>
  );
}
