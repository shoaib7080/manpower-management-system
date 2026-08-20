import { create } from 'zustand';

/**
 * Tracks the currently active ERP module across Topbar and Sidebar.
 * This is UI state — intentionally separate from AuthContext so module
 * switches don't re-render the entire auth tree.
 */
const useModuleStore = create((set) => ({
  activeModule: 'operations', // default on login
  setModule: (moduleId) => set({ activeModule: moduleId }),
}));

export default useModuleStore;
