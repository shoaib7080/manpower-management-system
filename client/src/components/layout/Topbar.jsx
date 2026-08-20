import { Bell, ChevronDown, Search, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { MODULES, getModule } from "../../config/modules.config";
import useModuleStore from "../../store/useModuleStore";

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

/**
 * Resolves which modules are visible in the switcher dropdown for the current user.
 * Rules:
 *   - superAdminOnly modules: only shown when permissions.superAdmin === true
 *   - Regular modules: shown when permissions[id] >= requiredLevel
 */
function useVisibleModules() {
  const { user } = useAuth();
  const permissions = user?.permissions ?? {};

  return MODULES.filter((m) => {
    if (m.superAdminOnly) return permissions.superAdmin === true;
    if (permissions.superAdmin === true) return true; // ← add this line
    return (permissions[m.id] ?? 0) >= m.requiredLevel;
  });
}

export default function Topbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { activeModule, setModule } = useModuleStore();
  const visibleModules = useVisibleModules();

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (moduleId) => {
    setModule(moduleId);
    setOpen(false);
    const mod = getModule(moduleId);
    navigate(mod.rootRoute);
  };

  const currentModule = getModule(activeModule);
  const CurrentIcon = currentModule?.Icon;

  return (
    <div className="flex items-center gap-3 px-[30px] py-3 bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-20">
      {/* ── Module Switcher ─────────────────────────────────────── */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen((o) => !o)}
          className={`flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 rounded border text-label-sm font-semibold transition-colors ${
            open
              ? "bg-primary-container/10 border-primary-container/30 text-primary-container"
              : "bg-surface-container-low border-outline-variant text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
          }`}
          title="Switch module"
        >
          {CurrentIcon && <CurrentIcon size={13} className="shrink-0" />}
          <span>{currentModule?.label ?? "Select Module"}</span>
          <ChevronDown
            size={12}
            className={`shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute left-0 top-full mt-1.5 w-48 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg overflow-hidden z-50 py-1">
            {visibleModules.map((mod) => {
              const Icon = mod.Icon;
              const isActive = mod.id === activeModule;
              return (
                <button
                  key={mod.id}
                  onClick={() => handleSelect(mod.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-label-sm transition-colors ${
                    isActive
                      ? "bg-primary-container/10 text-primary-container font-semibold"
                      : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                  }`}
                >
                  <Icon size={14} className="shrink-0" />
                  <span>{mod.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-container" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Search bar ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-1 max-w-[420px] px-3 py-1.5 rounded border border-outline-variant bg-surface-container-low text-outline">
        <Search size={15} className="shrink-0" />
        <input
          type="text"
          placeholder="Search orders, personnel…"
          disabled
          className="bg-transparent outline-none text-body-sm text-on-surface w-full placeholder:text-outline disabled:cursor-not-allowed"
        />
      </div>

      {/* ── Right actions ───────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 ml-auto">
        <button
          className="w-8 h-8 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low relative disabled:hover:bg-transparent"
          title="Notifications"
          disabled
        >
          <Bell size={17} />
        </button>
        <button
          className="w-8 h-8 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low disabled:hover:bg-transparent"
          title="Settings"
          disabled
        >
          <Settings size={17} />
        </button>

        {/* Avatar */}
        <div
          className="w-[30px] h-[30px] rounded-full bg-primary-container/10 text-primary-container flex items-center justify-center font-bold text-label-sm ml-1"
          title={user?.name}
        >
          {initials(user?.name)}
        </div>
      </div>
    </div>
  );
}
