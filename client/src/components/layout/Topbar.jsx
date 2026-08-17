import { Bell, Search, Settings } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

export default function Topbar() {
  const { user } = useAuth();

  return (
    <div className="flex items-center gap-4 px-[30px] py-3 bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-20">
      <div className="flex items-center gap-2 flex-1 max-w-[420px] px-3 py-1.5 rounded border border-outline-variant bg-surface-container-low text-outline">
        <Search size={15} className="shrink-0" />
        <input
          type="text"
          placeholder="Search orders, personnel…"
          disabled
          className="bg-transparent outline-none text-body-sm text-on-surface w-full placeholder:text-outline disabled:cursor-not-allowed"
        />
      </div>
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
        <div
          className="w-[30px] h-[30px] rounded-[9999px] bg-primary-container/10 text-primary-container flex items-center justify-center font-bold text-label-sm ml-1"
          title={user?.name}
        >
          {initials(user?.name)}
        </div>
      </div>
    </div>
  );
}
