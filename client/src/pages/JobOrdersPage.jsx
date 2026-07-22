import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { assignSlot, fetchJobOrders, fetchSlotSuggestions, createJobOrder } from '../api/services';
import CreateJobOrderModal from '../components/jobOrders/CreateJobOrdersModal';
import JobOrderCard from '../components/jobOrders/JobOrderCard';
import AuditModal from '../components/manpower/AuditModal';

export default function JobOrdersPage() {
  const queryClient = useQueryClient();

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedJobOrder, setSelectedJobOrder] = useState(null);
  const [candidateToAssign, setCandidateToAssign] = useState(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
 const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch active site job orders
  const { data: jobOrders = [], isLoading } = useQuery({
    queryKey: ['jobOrders'],
    queryFn: async () => {
      const res = await fetchJobOrders();
      return res.data;
    },
  });

  // Fetch candidate suggestions when slot selected
  const { data: suggestionsData } = useQuery({
    queryKey: ['suggestions', selectedSlot?.trade, selectedJobOrder?.clientCategory],
    queryFn: async () => {
      if (!selectedSlot) return null;
      const res = await fetchSlotSuggestions({
        trade: selectedSlot.trade,
        clientCategory: selectedJobOrder.clientCategory,
      });
      return res.data;
    },
    enabled: !!selectedSlot,
  });

  // Allocation mutation
  const assignMutation = useMutation({
    mutationFn: (auditPayload) =>
      assignSlot(selectedJobOrder._id, {
        slotId: selectedSlot._id,
        employeeId: candidateToAssign._id,
        ...auditPayload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['jobOrders']);
      setIsAuditModalOpen(false);
      setSelectedSlot(null);
      setCandidateToAssign(null);
    },
  });

    const createJobOrderMutation = useMutation({
    mutationFn: createJobOrder,
    onSuccess: () => {
      queryClient.invalidateQueries(['jobOrders']);
      setIsCreateModalOpen(false);
    },
  });

  const handleOpenSuggestions = (jobOrder, slot) => {
    setSelectedJobOrder(jobOrder);
    setSelectedSlot(slot);
  };

  const handleSelectCandidate = (candidate) => {
    setCandidateToAssign(candidate);
    setIsAuditModalOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Job Order Site Fulfillment Matrix</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-3 py-2 rounded font-medium flex items-center gap-2 transition-all"
        >
          + Create Job Order
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading Job Orders...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {jobOrders.map((jo) => (
            <JobOrderCard key={jo._id} jobOrder={jo} onOpenSuggestions={handleOpenSuggestions} />
          ))}
        </div>
      )}

      {/* Suggestion Drawer/Panel */}
      {selectedSlot && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-slate-300 shadow-xl p-6 z-40 overflow-y-auto">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="font-bold text-slate-900">Available {selectedSlot.trade}s</h3>
            <button onClick={() => setSelectedSlot(null)} className="text-xs text-slate-500 hover:underline">Close</button>
          </div>

          <p className="text-xs text-slate-600 mb-4">
            Showing available workers matching clearances for <strong>{selectedJobOrder.clientCategory}</strong>.
          </p>

          <div className="space-y-3">
            {suggestionsData?.suggestions?.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No available workers with valid clearances found.</p>
            ) : (
              suggestionsData?.suggestions?.map((cand) => (
                <div key={cand._id} className="p-3 border border-slate-200 rounded flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{cand.name}</h4>
                    <p className="text-xs text-slate-500">ID: {cand.employeeId}</p>
                  </div>
                  <button
                    onClick={() => handleSelectCandidate(cand)}
                    className="bg-slate-900 text-white text-xs px-3 py-1 rounded font-medium hover:bg-slate-800"
                  >
                    Select
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Enforced Audit Modal */}
      <AuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        onSubmit={(auditData) => assignMutation.mutate(auditData)}
        workerName={candidateToAssign?.name}
        targetSite={selectedJobOrder?.siteName}
      />
            <CreateJobOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={(payload) => createJobOrderMutation.mutate(payload)}
        isPending={createJobOrderMutation.isPending}
      />
    </div>
  );
}