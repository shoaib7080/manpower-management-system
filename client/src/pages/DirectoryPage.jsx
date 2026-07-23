// client/src/pages/DirectoryPage.jsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Upload } from 'lucide-react';
import { useState } from 'react';
import { fetchEmployees, uploadExcel } from '../api/services';
import ManpowerTable from '../components/manpower/ManpowerTable';

export default function DirectoryPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrade, setSelectedTrade] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [complianceFilter, setComplianceFilter] = useState('');
  const [uploadStatus, setUploadStatus] = useState(null);

  // Fetch employees with search, deployment status & training compliance filters
  const { data, isLoading } = useQuery({
    queryKey: ['employees', searchTerm, selectedTrade, selectedStatus, complianceFilter],
    queryFn: async () => {
      const res = await fetchEmployees({
        search: searchTerm,
        trade: selectedTrade,
        status: selectedStatus,
        compliance: complianceFilter,
      });
      return res.data;
    },
  });

  const employees = data?.employees || [];
  const summary = data?.summary || {};

  const excelMutation = useMutation({
    mutationFn: (formData) => uploadExcel(formData),
    onSuccess: (res) => {
      setUploadStatus(`Success: ${res.data.message}`);
      queryClient.invalidateQueries(['employees']);
    },
    onError: (err) => {
      setUploadStatus(`Error: ${err.response?.data?.message || 'Upload failed'}`);
    },
  });

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    excelMutation.mutate(formData);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Excel Import */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Personnel Registry & Compliance Matrix</h1>
          <p className="text-xs text-slate-500">Track qualifications, deployment pipelines, and safety clearance expiration alerts.</p>
        </div>

        <label className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-3 py-2 rounded font-medium flex items-center gap-2 cursor-pointer transition-all">
          <Upload size={14} />
          {excelMutation.isPending ? 'Importing Excel...' : 'Import Excel Data'}
          <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {uploadStatus && (
        <div className="p-3 text-xs border rounded bg-slate-100 text-slate-800 flex justify-between">
          <span>{uploadStatus}</span>
          <button onClick={() => setUploadStatus(null)} className="font-bold">X</button>
        </div>
      )}

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-3 border rounded shadow-sm">
          <p className="text-[10px] font-bold uppercase text-slate-500">Total Workforce</p>
          <p className="text-lg font-extrabold text-slate-900">{summary.total || 0}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded shadow-sm">
          <p className="text-[10px] font-bold uppercase text-emerald-700">Available (Bench)</p>
          <p className="text-lg font-extrabold text-emerald-800">{summary.available || 0}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 p-3 rounded shadow-sm">
          <p className="text-[10px] font-bold uppercase text-purple-700">Booked (Hard Lock)</p>
          <p className="text-lg font-extrabold text-purple-800">{summary.booked || 0}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 p-3 rounded shadow-sm">
          <p className="text-[10px] font-bold uppercase text-blue-700">Mobilized (On-Site)</p>
          <p className="text-lg font-extrabold text-blue-800">{summary.mobilized || 0}</p>
        </div>
        <div className="bg-red-50 border border-red-200 p-3 rounded shadow-sm">
          <p className="text-[10px] font-bold uppercase text-red-700">Expired Trainings</p>
          <p className="text-lg font-extrabold text-red-800">{summary.expiredTrainings || 0}</p>
        </div>
      </div>

      {/* Unified Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-3 border border-slate-200 rounded">
        {/* Search Field */}
        <div className="flex items-center gap-2 border border-slate-300 rounded px-2.5 bg-slate-50">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search Name, Emp ID, Emirates ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs p-2 bg-transparent outline-none"
          />
        </div>

        {/* Trade Filter */}
        <select
          value={selectedTrade}
          onChange={(e) => setSelectedTrade(e.target.value)}
          className="text-xs border border-slate-300 rounded p-2 outline-none bg-slate-50"
        >
          <option value="">All Trades</option>
          <option value="Fabricator">Fabricator</option>
          <option value="Welder">Welder</option>
          <option value="Fitter">Fitter</option>
          <option value="Supervisor">Supervisor</option>
          <option value="Foreman">Foreman</option>
          <option value="Rigger">Rigger</option>
          <option value="Helper">Helper</option>
        </select>

        {/* Deployment Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="text-xs border border-slate-300 rounded p-2 outline-none bg-slate-50 font-semibold text-slate-800"
        >
          <option value="">All Statuses</option>
          <option value="AVAILABLE">🟢 AVAILABLE (Bench)</option>
          <option value="RESERVED">🟡 RESERVED (Soft Lock)</option>
          <option value="BOOKED">🟣 BOOKED (Hard Lock)</option>
          <option value="MOBILIZED">🔵 MOBILIZED (On-Site)</option>
          <option value="HALTED">🔴 HALTED / VACATION</option>
        </select>

        {/* Training Compliance Filter */}
        <select
          value={complianceFilter}
          onChange={(e) => setComplianceFilter(e.target.value)}
          className="text-xs border border-slate-300 rounded p-2 outline-none bg-slate-50 font-semibold text-slate-800"
        >
          <option value="">All Training Clearances</option>
          <option value="EXPIRED">⚠️ Expired Training</option>
          <option value="EXPIRING_SOON">⏳ Expiring Within 30 Days</option>
          <option value="INCOMPLETE">❌ Incomplete / Missing Training</option>
          <option value="READY">✅ Fully Compliant / Ready</option>
        </select>
      </div>

      {/* Personnel Table */}
      {isLoading ? (
        <p className="text-xs text-slate-500">Filtering personnel registry...</p>
      ) : (
        <ManpowerTable employees={employees} onSelectWorker={() => {}} />
      )}
    </div>
  );
}