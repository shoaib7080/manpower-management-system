import { create } from 'zustand';

export const STAGES = ['RESERVED', 'BOOKED', 'MOBILIZED'];

const useDashboardStore = create((set, get) => ({
  ui: {
    drawer: { open: false, joId: null, slotIdx: null },
    audit: { open: false, pending: null },
    admin: { open: false, pending: null },
  },

  openDrawer: (joId, slotIdx, slotId) =>
    set((s) => ({ ui: { ...s.ui, drawer: { open: true, joId, slotIdx, slotId } } })),
  closeDrawer: () =>
    set((s) => ({ ui: { ...s.ui, drawer: { open: false, joId: null, slotIdx: null } } })),

  // Called from SuggestDrawer after picking a candidate — opens AuditModal for AVAILABLE->RESERVED
  openAssignAudit: (joId, slotIdx, emp) =>
    set((s) => ({
      ui: {
        ...s.ui,
        drawer: { open: false, joId: null, slotIdx: null, slotId: null },
        audit: {
          open: true,
          pending: {
            workerName: emp.name,
            workerTrade: emp.trade,
            from: 'AVAILABLE',
            to: 'RESERVED',
            action: { type: 'assign', joId, slotIdx, empId: emp._id },
          },
        },
      },
    })),

  // Forward pipeline advance — always goes through AuditModal
  requestAdvance: (joId, slotIdx, emp, fromStatus) => {
    const next = STAGES[STAGES.indexOf(fromStatus) + 1];
    set((s) => ({
      ui: {
        ...s.ui,
        audit: {
          open: true,
          pending: {
            workerName: emp.name,
            workerTrade: emp.trade,
            from: fromStatus,
            to: next,
            action: { type: 'advance', joId, slotIdx, targetStatus: next },
          },
        },
      },
    }));
  },

  // Swap/release — locked statuses go through AdminOverrideModal first
  requestSwap: (joId, slotIdx, emp, currentStatus) => {
    const pendingAudit = {
      workerName: emp.name,
      workerTrade: emp.trade,
      from: currentStatus,
      to: 'AVAILABLE',
      action: { type: 'release', joId, slotIdx },
    };
    const locked = currentStatus === 'BOOKED' || currentStatus === 'MOBILIZED';
    if (locked) {
      set((s) => ({
        ui: {
          ...s.ui,
          admin: { open: true, pending: { workerName: emp.name, status: currentStatus, next: pendingAudit } },
        },
      }));
    } else {
      set((s) => ({ ui: { ...s.ui, audit: { open: true, pending: pendingAudit } } }));
    }
  },

  closeAdminModal: () =>
    set((s) => ({ ui: { ...s.ui, admin: { open: false, pending: null } } })),

  confirmAdminOverride: () => {
    const next = get().ui.admin.pending?.next;
    set((s) => ({
      ui: { ...s.ui, admin: { open: false, pending: null }, audit: { open: true, pending: next } },
    }));
  },

  closeAuditModal: () =>
    set((s) => ({ ui: { ...s.ui, audit: { open: false, pending: null } } })),
}));

export default useDashboardStore;
