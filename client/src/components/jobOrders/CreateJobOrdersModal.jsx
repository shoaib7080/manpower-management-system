import React, { useState } from 'react';
import { X, Briefcase, Plus, Trash2, AlertCircle } from 'lucide-react';

const CLIENT_CATEGORIES = ['ADNOC Onshore', 'ADNOC Offshore', 'Internal Production', 'Other'];
const TRADE_LIST = ['Supervisor', 'Foreman', 'Fabricator', 'Welder', 'Fitter', 'Rigger', 'Helper', 'Other'];

export default function CreateJobOrderModal({ isOpen, onClose, onSubmit, isPending }) {
  const [jobOrderNumber, setJobOrderNumber] = useState('');
  const [siteName, setSiteName] = useState('');
  const [clientCategory, setClientCategory] = useState('ADNOC Offshore');
  const [projectEngineer, setProjectEngineer] = useState('');
  const [startDate, setStartDate] = useState('');
  const [requirements, setRequirements] = useState([
    { trade: 'Fabricator', requiredQty: 3 },
    { trade: 'Welder', requiredQty: 2 }
  ]);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddRequirement = () => {
    setRequirements([...requirements, { trade: 'Fitter', requiredQty: 1 }]);
  };

  const handleRemoveRequirement = (index) => {
    if (requirements.length === 1) return;
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const handleReqChange = (index, field, value) => {
    const updated = [...requirements];
    updated[index][field] = field === 'requiredQty' ? parseInt(value) || 1 : value;
    setRequirements(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!jobOrderNumber.trim() || !siteName.trim() || !projectEngineer.trim() || !startDate) {
      setError('Please fill in all required job order details.');
      return;
    }

    const payload = {
      jobOrderNumber: jobOrderNumber.trim(),
      siteName: siteName.trim(),
      clientCategory,
      projectEngineer: projectEngineer.trim(),
      startDate,
      requirements
    };

    setError('');
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-300 rounded-md w-full max-w-xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <div className="flex items-center gap-2">
            <Briefcase size={18} className="text-blue-600" />
            <h3 className="font-bold text-slate-900">Create New Job Order</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><X size={18} /></button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Job Order Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={jobOrderNumber}
                onChange={(e) => setJobOrderNumber(e.target.value)}
                placeholder="e.g. JO-2026-101"
                className="w-full text-xs border border-slate-300 rounded p-2 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Site Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="e.g. ADNOC Offshore Das Island"
                className="w-full text-xs border border-slate-300 rounded p-2 outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Client Category</label>
              <select
                value={clientCategory}
                onChange={(e) => setClientCategory(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded p-2 outline-none bg-white focus:border-blue-600"
              >
                {CLIENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Lead Project Engineer <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={projectEngineer}
                onChange={(e) => setProjectEngineer(e.target.value)}
                placeholder="Eng. Ahmed Al-Mansoori"
                className="w-full text-xs border border-slate-300 rounded p-2 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Target Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded p-2 outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <hr className="border-slate-200 my-2" />

          {/* Trade Requirements List */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold uppercase text-slate-700">Team Trade Requirements</h4>
              <button
                type="button"
                onClick={handleAddRequirement}
                className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline"
              >
                <Plus size={14} /> Add Trade
              </button>
            </div>

            {requirements.map((req, index) => (
              <div key={index} className="flex items-center gap-2 bg-slate-50 p-2 border rounded">
                <div className="flex-1">
                  <select
                    value={req.trade}
                    onChange={(e) => handleReqChange(index, 'trade', e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded p-1.5 outline-none bg-white"
                  >
                    {TRADE_LIST.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="w-24">
                  <input
                    type="number"
                    min="1"
                    value={req.requiredQty}
                    onChange={(e) => handleReqChange(index, 'requiredQty', e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded p-1.5 outline-none"
                    placeholder="Qty"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveRequirement(index)}
                  className="text-slate-400 hover:text-red-600 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-50"
            >
              {isPending ? 'Generating Slots...' : 'Create Job Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}