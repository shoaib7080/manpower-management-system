import React from 'react';
import { UserCheck, UserPlus, Sparkles } from 'lucide-react';

export default function JobOrderCard({ jobOrder, onOpenSuggestions }) {
  const totalSlots = jobOrder.slots.length;
  const filledSlots = jobOrder.slots.filter((s) => s.assignedEmployee).length;
  const progressPercent = Math.round((filledSlots / totalSlots) * 100) || 0;

  return (
    <div className="bg-white border border-slate-300 rounded-sm p-5 shadow-sm space-y-4">
      {/* Site Header */}
      <div className="flex justify-between items-start border-b pb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {jobOrder.clientCategory}
          </span>
          <h3 className="text-lg font-bold text-slate-900">{jobOrder.siteName}</h3>
          <p className="text-xs text-slate-600">Eng: {jobOrder.projectEngineer} | Order #{jobOrder.jobOrderNumber}</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-slate-700">{filledSlots} / {totalSlots} Mobilized</span>
          <div className="w-32 bg-slate-200 h-2 rounded-full mt-1 overflow-hidden">
            <div className="bg-blue-600 h-full transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      {/* Trade Slots Grid */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase text-slate-500">Trade Slots Breakdown</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {jobOrder.slots.map((slot) => (
            <div
              key={slot._id}
              className={`p-2.5 border rounded flex justify-between items-center text-xs ${
                slot.assignedEmployee
                  ? 'bg-slate-50 border-slate-300'
                  : 'bg-slate-100/50 border-dashed border-slate-300'
              }`}
            >
              <div>
                <span className="font-semibold text-slate-800">{slot.trade} #{slot.slotNumber}</span>
                {slot.assignedEmployee ? (
                  <p className="text-slate-600 font-medium flex items-center gap-1 mt-0.5">
                    <UserCheck size={12} className="text-green-600" />
                    {slot.assignedEmployee.name}
                  </p>
                ) : (
                  <p className="text-slate-400 italic">Empty Slot</p>
                )}
              </div>

              {!slot.assignedEmployee && (
                <button
                  onClick={() => onOpenSuggestions(jobOrder, slot)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1"
                >
                  <Sparkles size={12} /> Suggest
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}