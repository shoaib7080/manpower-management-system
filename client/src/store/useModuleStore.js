import { create } from "zustand";
import { MODULES } from "../config/modules.config";

function moduleFromPath(pathname) {
  // Walk modules in reverse so more-specific prefixes (e.g. /finance) win over /
  const sorted = [...MODULES].sort(
    (a, b) => b.rootRoute.length - a.rootRoute.length,
  );
  const match = sorted.find((m) =>
    m.rootRoute === "/" ? pathname === "/" : pathname.startsWith(m.rootRoute),
  );
  return match?.id ?? "operations";
}

const useModuleStore = create((set) => ({
  activeModule: moduleFromPath(window.location.pathname),
  setModule: (moduleId) => set({ activeModule: moduleId }),
}));

export default useModuleStore;
