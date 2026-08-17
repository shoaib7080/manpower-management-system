import {
  Briefcase,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Tags,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LEGEND = [
  ["bg-outline", "Available"],
  ["bg-amber-500", "Reserved"],
  ["bg-indigo-500", "Booked · Locked"],
  ["bg-blue-500", "Mobilized · Locked"],
];

const NAV = [
  { to: "/", label: "Dashboard", Icon: LayoutDashboard, end: true },
  { to: "/directory", label: "Personnel Directory", Icon: Users },
  { to: "/job-orders", label: "Job Orders", Icon: ClipboardList },
  { to: "/audit-log", label: "Audit Trail", Icon: History },
];

const ADMIN_NAV = [
  { to: "/users", label: "User Management", Icon: ShieldCheck },
  { to: "/trades", label: "Trades", Icon: Briefcase },
  { to: "/specializations", label: "Specializations", Icon: Tags },
];

const navItemCls = ({ isActive }) =>
  `flex items-center gap-2.5 px-2.5 py-2 rounded text-label-md mb-0.5 ${
    isActive
      ? "bg-primary-container/10 text-primary-container font-semibold [&>svg]:text-primary-container"
      : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface [&>svg]:text-outline"
  }`;

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <div className="bg-surface-container-lowest border-r border-outline-variant flex flex-col p-3 sticky top-0 h-screen w-[232px] shrink-0">
      <div className="flex items-center gap-2.5 px-1 pb-4 mb-2">
        <div className="w-[30px] h-[30px] rounded-lg bg-primary-container flex items-center justify-center text-on-primary font-bold text-label-md shrink-0">
          MP
        </div>
        <div className="leading-tight">
          <div className="font-bold text-label-md text-on-surface">
            MANPOWER OPS
          </div>
          <div className="text-[10px] text-outline font-medium tracking-wide">
            Mobilisation Control
          </div>
        </div>
      </div>

      {NAV.map(({ to, label, Icon }) => (
        <NavLink key={to} to={to} className={navItemCls}>
          <Icon size={16} /> {label}
        </NavLink>
      ))}

      {user?.level === 1 && (
        <>
          <div className="text-[10px] font-bold tracking-wider uppercase text-outline px-2.5 pt-3 pb-1.5">
            Administration
          </div>
          {ADMIN_NAV.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className={navItemCls}>
              <Icon size={16} /> {label}
            </NavLink>
          ))}
        </>
      )}

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
