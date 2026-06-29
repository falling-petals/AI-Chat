import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api/auth';
import { useChatStore } from '../store';
import { toast } from 'sonner';

export default function Login() {
  const setToken = useChatStore((s) => s.setToken);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(username, password);
      localStorage.setItem('username', res.username);
      setToken(res.token);
      navigate('/');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-zinc-50 to-zinc-100 dark:from-[#0a0a0a] dark:via-[#0d0d0d] dark:to-[#111111] overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-amber-200/40 to-amber-300/10 dark:from-amber-500/10 dark:to-amber-600/5 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-zinc-200/30 to-zinc-300/10 dark:from-zinc-500/10 dark:to-zinc-600/5 blur-3xl" />
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-gradient-to-br from-amber-100/20 to-amber-200/5 dark:from-amber-400/5 dark:to-amber-500/0 blur-3xl" />

      <div className="w-full max-w-sm mx-4 relative">
        <div className="rounded-2xl bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-700/30 shadow-xl shadow-zinc-200/50 dark:shadow-zinc-950 p-8">
          <div className="text-center mb-8">
            <img src="/logo.svg" alt="AI Chat" className="w-14 h-14 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">Welcome back</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Sign in to your account</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-username" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Username</label>
              <input
                id="login-username"
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-100 outline-none transition-all placeholder:text-zinc-400 focus:border-amber-400/50 dark:focus:border-amber-500/50 focus:ring-2 focus:ring-amber-400/20 dark:focus:ring-amber-500/20"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Password</label>
              <input
                id="login-password"
                type="password"
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-100 outline-none transition-all placeholder:text-zinc-400 focus:border-amber-400/50 dark:focus:border-amber-500/50 focus:ring-2 focus:ring-amber-400/20 dark:focus:ring-amber-500/20"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg text-sm font-medium hover:from-amber-600 hover:to-amber-700 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium transition-colors">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
