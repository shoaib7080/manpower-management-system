import { Anchor, Plane, RotateCcw, Sparkles, UserCheck } from 'lucide-react';

export default function JobOrderCard({ jobOrder, onOpenSuggestions, onPipelineTransition }) {
  const totalSlots = jobOrder.slots.length;
  const mobilizedSlots = jobOrder.slots.filter((s) => s.status === 'MOBILIZED').length;
  const progressPercent = Math.round((mobilizedSlots / totalSlots) * 100) || 0;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RESERVED':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-300">🟡 RESERVED</span>;
      case 'BOOKED':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-300">🟣 BOOKED</span>;
      case 'MOBILIZED':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-300">🔵 MOBILIZED</span>;
      case 'UNASSIGNED':
        return <span className="bg-slate-100 text-slate-500 text-[10px] font-medium px-2 py-0.5 rounded">Unassigned</span>;
    }
  };

 return (
    <div className="bg-white border border-slate-300 rounded-sm p-5 shadow-sm space-y-4">
      {/* Site Header */}
      <div className="flex justify-between items-start border-b pb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{jobOrder.clientCategory}</span>
          <h3 className="text-lg font-bold text-slate-900">{jobOrder.siteName}</h3>
          <p className="text-xs text-slate-600">Eng: {jobOrder.projectEngineer} | Order #{jobOrder.jobOrderNumber}</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-slate-700">{mobilizedSlots} / {totalSlots} Mobilized</span>
          <div className="w-32 bg-slate-200 h-2 rounded-full mt-1 overflow-hidden">
            <div className="bg-blue-600 h-full transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      {/* Slots Matrix */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase text-slate-500">Trade Slots Pipeline</h4>
        <div className="grid grid-cols-1 gap-2">
          {jobOrder.slots.map((slot) => (
            <div key={slot._id} className="p-3 border rounded bg-slate-50 border-slate-200 flex justify-between items-center text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">{slot.trade} #{slot.slotNumber}</span>
                  {getStatusBadge(slot.status)}
                </div>
                {slot.assignedEmployee ? (
                  <p className="text-slate-700 font-semibold mt-1 flex items-center gap-1">
                    <UserCheck size={14} className="text-slate-500" />
                    {slot.assignedEmployee.name} ({slot.assignedEmployee.employeeId})
                  </p>
                ) : (
                  <p className="text-slate-400 italic mt-0.5">Empty Slot</p>
                )}
              </div>

              {/* Action Steppers */}
              <div className="flex items-center gap-2">
                {!slot.assignedEmployee && (
                  <button
                    onClick={() => onOpenSuggestions(jobOrder, slot)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1"
                  >
                    <Sparkles size={12} /> Assign Candidate
                  </button>
                )}

                {slot.status === 'RESERVED' && (
                  <button
                    onClick={() => onPipelineTransition(jobOrder, slot, 'BOOKED')}
                    className="bg-purple-700 hover:bg-purple-800 text-white px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1"
                  >
                    <Plane size={12} /> Mark Booked
                  </button>
                )}

                {slot.status === 'BOOKED' && (
                  <button
                    onClick={() => onPipelineTransition(jobOrder, slot, 'MOBILIZED')}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1"
                  >
                    <Anchor size={12} /> Mark Mobilized
                  </button>
                )}

                {slot.status === 'MOBILIZED' && (
                  <button
                    onClick={() => onPipelineTransition(jobOrder, slot, 'AVAILABLE')}
                    className="bg-slate-700 hover:bg-slate-800 text-white px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1"
                  >
                    <RotateCcw size={12} /> Demobilize
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}