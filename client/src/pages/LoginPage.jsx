// client/src/pages/LoginPage.jsx
import { AlertCircle, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-md shadow-2xl w-full max-w-sm p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex bg-blue-600 p-2.5 rounded-md text-white mb-1">
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Manpower Portal</h2>
          <p className="text-xs text-slate-500 font-mono">ADNOC Onshore & Offshore Logistics</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Email Address</label>
            <div className="flex items-center border border-slate-300 rounded px-2.5 bg-slate-50 focus-within:border-blue-600">
              <Mail size={16} className="text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@company.com"
                className="w-full text-xs p-2 bg-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Password</label>
            <div className="flex items-center border border-slate-300 rounded px-2.5 bg-slate-50 focus-within:border-blue-600">
              <Lock size={16} className="text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs p-2 bg-transparent outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-slate-900 text-white text-xs font-bold py-2.5 rounded hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        <p className="text-[11px] text-center text-slate-400 font-mono pt-2">
          Authorized Personnel Only • Level 1-3 RBAC Enabled
        </p>
      </div>
    </div>
  );
}