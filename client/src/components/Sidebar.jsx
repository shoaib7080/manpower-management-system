import { LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import { getModule } from "../config/modules.config";
import { useAuth } from "../context/AuthContext";
import usePermissions from "../hooks/usePermissions";
import useModuleStore from "../store/useModuleStore";

const LEGEND = [
  ["bg-outline", "Available"],
  ["bg-amber-500", "Reserved"],
  ["bg-indigo-500", "Booked · Locked"],
  ["bg-blue-500", "Mobilized · Locked"],
];

const navItemCls = ({ isActive }) =>
  `flex items-center gap-2.5 px-2.5 py-2 rounded text-label-md mb-0.5 ${
    isActive
      ? "bg-primary-container/10 text-primary-container font-semibold [&>svg]:text-primary-container"
      : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface [&>svg]:text-outline"
  }`;

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { activeModule } = useModuleStore();

  // Get the current module's nav config from the central registry
  const moduleConfig = getModule(activeModule);

  // Check admin-level access for this module using the RBAC hook.
  // This fixes the broken user?.level === 1 check — now correctly reads permissions.
  const { isAdmin } = usePermissions(
    activeModule === "superadmin" ? null : activeModule,
  );

  // Resolve the active module's icon for the brand area
  const ModuleIcon = moduleConfig?.Icon;

  return (
    <div className="bg-surface-container-lowest border-r border-outline-variant flex flex-col p-3 sticky top-0 h-screen w-[232px] shrink-0">
      {/* Brand / Module indicator */}
      <div className="flex items-center gap-2.5 px-1 pb-4 mb-2">
        <div className="w-[30px] h-[30px] rounded-lg bg-primary-container flex items-center justify-center text-on-primary font-bold text-label-md shrink-0">
          {ModuleIcon ? <ModuleIcon size={15} /> : "MP"}
        </div>
        <div className="leading-tight">
          <div className="font-bold text-label-md text-on-surface">
            ERP PLATFORM
          </div>
          <div className="text-[10px] text-outline font-medium tracking-wide capitalize">
            {moduleConfig?.label ?? "Operations"}
          </div>
        </div>
      </div>

      {/* Primary nav — from module registry */}
      {moduleConfig?.nav.map(({ to, label, Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={navItemCls}>
          <Icon size={16} /> {label}
        </NavLink>
      ))}

      {/* Admin nav — only shown when user has admin-level access */}
      {isAdmin && moduleConfig?.adminNav?.length > 0 && (
        <>
          <div className="text-[10px] font-bold tracking-wider uppercase text-outline px-2.5 pt-3 pb-1.5">
            Administration
          </div>
          {moduleConfig.adminNav.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className={navItemCls}>
              <Icon size={16} /> {label}
            </NavLink>
          ))}
        </>
      )}

      {/* Footer — legend + logout */}
      <div className="mt-auto pt-3.5 border-t border-outline-variant">
        <div className="text-[10px] text-outline tracking-wide mb-1.5 font-bold uppercase">
          Mobilisation Pipeline
        </div>
        {LEGEND.map(([dotCls, label]) => (
          <div
            key={label}
            className="flex items-center gap-1.5 text-label-sm text-on-surface-variant py-0.5"
          >
            <span className={`w-1.5 h-1.5 rounded-[2px] shrink-0 ${dotCls}`} />
            {label}
          </div>
        ))}
        {user && (
          <button
            onClick={logout}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded text-label-md text-on-surface-variant hover:bg-surface-container-low w-full mt-3 border-none bg-transparent"
          >
            <LogOut size={16} /> Sign Out
          </button>
        )}
      </div>
    </div>
  );
}
