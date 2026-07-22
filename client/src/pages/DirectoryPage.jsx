// src/pages/DirectoryPage.jsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Filter, Search, Upload } from 'lucide-react';
import { useState } from 'react';
import { createEmployee, fetchEmployees, uploadExcel } from '../api/services';
import CreateEmployeeModal from '../components/manpower/CreateEmployeeModal';
import ManpowerTable from '../components/manpower/ManpowerTable';

export default function DirectoryPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrade, setSelectedTrade] = useState('');
  const [uploadStatus, setUploadStatus] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch employees with search & trade filters
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees', searchTerm, selectedTrade],
    queryFn: async () => {
      const res = await fetchEmployees({ search: searchTerm, trade: selectedTrade });
      return res.data;
    },
  });

  // Bulk Excel Upload Mutation
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

    const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries(['employees']);
      setIsCreateModalOpen(false);
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
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Personnel Master Registry</h1>
          <p className="text-xs text-slate-500">Track qualifications, ADNOC clearances, and site availability.</p>
        </div>

          <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-3 py-2 rounded font-medium flex items-center gap-2 transition-all"
          >
            + Add New Employee
          </button>

        {/* Excel Import Trigger */}
        <label className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-3 py-2 rounded font-medium flex items-center gap-2 cursor-pointer transition-all">
          <Upload size={14} />
          {excelMutation.isPending ? 'Importing Excel...' : 'Import Excel Data'}
          <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>
    </div>

      {uploadStatus && (
        <div className="p-3 text-xs border rounded bg-slate-100 text-slate-800 flex justify-between">
          <span>{uploadStatus}</span>
          <button onClick={() => setUploadStatus(null)} className="font-bold">X</button>
        </div>
      )}

      {/* Filter Controls */}
      <div className="flex gap-4 bg-white p-3 border border-slate-200 rounded">
        <div className="flex-1 flex items-center gap-2 border border-slate-300 rounded px-2 bg-slate-50">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search by Name, Employee ID, or Emirates ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs p-1.5 bg-transparent outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select
            value={selectedTrade}
            onChange={(e) => setSelectedTrade(e.target.value)}
            className="text-xs border border-slate-300 rounded p-1.5 outline-none bg-slate-50"
          >
            <option value="">All Trades</option>
            <option value="Fabricator">Fabricator</option>
            <option value="Welder">Welder</option>
            <option value="Fitter">Fitter</option>
            <option value="Supervisor">Supervisor</option>
            <option value="Foreman">Foreman</option>
          </select>
        </div>
      </div>

      {/* Personnel Table Component */}
      {isLoading ? (
        <p className="text-xs text-slate-500">Loading directory...</p>
      ) : (
        <ManpowerTable employees={employees} onSelectWorker={() => {}} />
      )}
       <CreateEmployeeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={(payload) => createMutation.mutate(payload)}
        isPending={createMutation.isPending}
      />
    </div>
  );
}