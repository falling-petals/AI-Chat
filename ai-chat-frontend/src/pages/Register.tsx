import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/auth';
import { MessageSquare } from 'lucide-react';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(username, password);
      navigate('/login');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20">
        <div className="flex items-center justify-center gap-3 mb-8">
          <MessageSquare className="w-8 h-8 text-[#6366F1]" />
          <h1 className="text-2xl font-bold text-[#1E1B4B]">Create Account</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#475569] mb-1">Username</label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:border-[#6366F1] transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#475569] mb-1">Password</label>
            <input
              type="password"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:border-[#6366F1] transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-2.5 bg-[#6366F1] text-white rounded-xl font-medium hover:bg-[#4F46E5] transition-colors cursor-pointer"
          >
            Sign Up
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-[#64748B]">
          Already have an account?{' '}
          <Link to="/login" className="text-[#6366F1] hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
