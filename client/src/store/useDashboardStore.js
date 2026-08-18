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

  // Called from SuggestDrawer after picking a candidate — user selects target status
  openAssignAudit: (joId, slotIdx, emp, targetStatus = 'RESERVED') =>
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
            to: targetStatus,
            action: { type: 'assign', joId, slotIdx, empId: emp._id },
          },
        },
      },
    })),

  // Called when assigning an external/subcontractor worker
  openAssignExternalAudit: (joId, slotIdx, externalWorker, trade, targetStatus = 'RESERVED') =>
    set((s) => ({
      ui: {
        ...s.ui,
        drawer: { open: false, joId: null, slotIdx: null, slotId: null },
        audit: {
          open: true,
          pending: {
            workerName: `${externalWorker.name}${externalWorker.company ? ` (${externalWorker.company})` : " (Subcontractor)"}`,
            workerTrade: trade,
            from: "UNASSIGNED",
            to: targetStatus,
            action: {
              type: "assign",
              joId,
              slotIdx,
              isExternal: true,
              externalWorker,
            },
          },
        },
      },
    })),

  // Direct status selection — user picks target status via dropdown
  requestAdvance: (joId, slotIdx, emp, fromStatus, targetStatus) => {
    const resolvedTarget = targetStatus || STAGES[STAGES.indexOf(fromStatus) + 1];
    set((s) => ({
      ui: {
        ...s.ui,
        audit: {
          open: true,
          pending: {
            workerName: emp.name,
            workerTrade: emp.trade,
            from: fromStatus,
            to: resolvedTarget,
            action: { type: 'advance', joId, slotIdx, targetStatus: resolvedTarget },
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
