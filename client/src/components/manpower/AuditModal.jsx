import React, { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';

export default function AuditModal({ isOpen, onClose, onSubmit, workerName, targetSite }) {
  const [reasonForChange, setReasonForChange] = useState('');
  const [authorizedBy, setAuthorizedBy] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reasonForChange.trim() || !authorizedBy.trim()) {
      setError('Both "Reason for Change" and "Authorized By" are strictly required.');
      return;
    }
    setError('');
    onSubmit({ reasonForChange, authorizedBy });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white border border-slate-300 rounded-md w-full max-w-md p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="font-semibold text-slate-900">Allocation Audit Control</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><X size={18} /></button>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          Assigning <strong className="text-slate-900">{workerName}</strong> to <strong className="text-slate-900">{targetSite}</strong>.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Reason for Revision <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reasonForChange}
              onChange={(e) => setReasonForChange(e.target.value)}
              placeholder="e.g., Replacing demobilized welder per Site Request #2"
              className="w-full text-sm border border-slate-300 rounded p-2 focus:border-blue-600 outline-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Authorized By (Engineer/Manager) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={authorizedBy}
              onChange={(e) => setAuthorizedBy(e.target.value)}
              placeholder="e.g., Eng. Ahmed Al-Mansoori"
              className="w-full text-sm border border-slate-300 rounded p-2 focus:border-blue-600 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800"
            >
              Confirm & Save Log
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}