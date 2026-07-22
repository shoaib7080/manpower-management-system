// client/src/App.jsx
import { Briefcase, LogOut, ShieldAlert, Users } from 'lucide-react';
import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import DirectoryPage from './pages/DirectoryPage';
import JobOrdersPage from './pages/JobOrdersPage';
import LoginPage from './pages/LoginPage';

function DashboardContent() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('job-orders');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-1.5 rounded">
              <ShieldAlert size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide">Manpower Allocation System</h1>
              <p className="text-[10px] text-slate-400 font-mono">
                User: {user?.name} (Level {user?.level})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <nav className="flex gap-1 bg-slate-800 p-1 rounded border border-slate-700">
              <button
                onClick={() => setActiveTab('job-orders')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold ${
                  activeTab === 'job-orders' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Briefcase size={14} /> Job Orders
              </button>
              <button
                onClick={() => setActiveTab('directory')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold ${
                  activeTab === 'directory' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users size={14} /> Personnel Directory
              </button>
            </nav>

            <button
              onClick={logout}
              title="Logout"
              className="text-slate-400 hover:text-red-400 p-1.5 rounded transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-12">
        {activeTab === 'job-orders' && <JobOrdersPage />}
        {activeTab === 'directory' && <DirectoryPage />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

function MainLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div className="p-6 text-xs text-slate-500">Loading Session...</div>;
  if (!isAuthenticated) return <LoginPage />;

  return <DashboardContent />;
}