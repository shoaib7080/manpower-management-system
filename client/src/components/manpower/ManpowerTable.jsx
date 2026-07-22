import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

export default function ManpowerTable({ employees, onSelectWorker }) {
  const getTrainingBadge = (expiryDate) => {
    if (!expiryDate) return <span className="text-slate-400 text-xs">N/A</span>;
    
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return (
        <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-[11px] font-medium px-2 py-0.5 rounded">
          <ShieldX size={12} /> Expired
        </span>
      );
    } else if (daysUntilExpiry <= 30) {
      return (
        <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-[11px] font-medium px-2 py-0.5 rounded">
          <ShieldAlert size={12} /> {daysUntilExpiry}d left
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-[11px] font-medium px-2 py-0.5 rounded">
        <ShieldCheck size={12} /> Valid
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const styles = {
      Available: 'bg-green-100 text-green-800 border-green-300',
      Mobilized: 'bg-blue-100 text-blue-800 border-blue-300',
      Reserved: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      Halted: 'bg-red-100 text-red-800 border-red-300',
    };
    return (
      <span className={`text-xs px-2 py-0.5 border font-medium rounded ${styles[status] || 'bg-slate-100'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto border border-slate-300 rounded-sm bg-white">
      <table className="enterprise-table">
        <thead>
          <tr>
            <th>Emp ID</th>
            <th>Name</th>
            <th>Trade</th>
            <th>Status</th>
            <th>Active Site</th>
            <th>H2S Expiry</th>
            <th>Sea Survival</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp._id}>
              <td className="font-mono font-medium text-slate-700">{emp.employeeId}</td>
              <td className="font-semibold text-slate-900">{emp.name}</td>
              <td>{emp.trade}</td>
              <td>{getStatusBadge(emp.status)}</td>
              <td className="text-slate-600">{emp.currentAssignment?.siteName || 'Bench'}</td>
              <td>{getTrainingBadge(emp.trainings?.h2sExpiry)}</td>
              <td>{getTrainingBadge(emp.trainings?.seaSurvivalExpiry)}</td>
              <td>
                <button
                  onClick={() => onSelectWorker(emp)}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Manage / Allocate
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}