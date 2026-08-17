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
    <div className="min-h-screen bg-on-background flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0_4px_12px_rgba(15,23,42,0.16)] w-full max-w-sm p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex bg-primary-container p-2.5 rounded-lg text-on-primary mb-1">
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-headline-sm text-on-background">Manpower Portal</h2>
          <p className="font-mono-data text-[11px] text-on-surface-variant">
            ADNOC Onshore &amp; Offshore Logistics
          </p>
        </div>

        {error && (
          <div className="p-3 bg-error-container/40 border border-error/30 text-on-error-container text-body-sm rounded flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-error" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-label-sm uppercase tracking-wide text-on-surface-variant mb-1.5">
              Email Address
            </label>
            <div className="flex items-center gap-2 border border-outline-variant rounded px-2.5 bg-surface-container-low focus-within:border-primary-container focus-within:ring-2 focus-within:ring-primary-container/15">
              <Mail size={16} className="text-outline shrink-0" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@company.com"
                className="w-full text-body-sm py-2 bg-transparent outline-none text-on-surface placeholder:text-outline"
              />
            </div>
          </div>

          <div>
            <label className="block text-label-sm uppercase tracking-wide text-on-surface-variant mb-1.5">
              Password
            </label>
            <div className="flex items-center gap-2 border border-outline-variant rounded px-2.5 bg-surface-container-low focus-within:border-primary-container focus-within:ring-2 focus-within:ring-primary-container/15">
              <Lock size={16} className="text-outline shrink-0" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-body-sm py-2 bg-transparent outline-none text-on-surface placeholder:text-outline"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary-container text-on-primary text-label-md font-semibold py-2.5 rounded hover:bg-primary transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        <p className="font-mono-data text-[11px] text-center text-outline pt-2">
          Authorized Personnel Only • Level 1-3 RBAC Enabled
        </p>
      </div>
    </div>
  );
}
