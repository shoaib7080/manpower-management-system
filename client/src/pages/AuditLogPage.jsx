import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";
import { fetchAuditLogs } from "../api/services";
import StatusBadge from "../components/StatusBadge";

const fmt = (d) =>
  new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const th =
  "text-left text-label-sm uppercase text-on-surface-variant bg-surface-container-low px-3.5 py-2.5 border-b border-outline-variant whitespace-nowrap";
const td = "px-3.5 py-2.5 border-b border-outline-variant align-middle";

export default function AuditLogPage() {
  const [search, setSearch] = useState("");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["auditLogs"],
    queryFn: async () => {
      const res = await fetchAuditLogs();
      return res.data;
    },
  });

  const filtered = logs.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.employeeName?.toLowerCase().includes(q) ||
      l.newSite?.toLowerCase().includes(q) ||
      l.previousSite?.toLowerCase().includes(q) ||
      l.authorizedBy?.toLowerCase().includes(q) ||
      l.reasonForChange?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="flex items-start justify-between gap-5 flex-wrap mb-4">
        <div>
          <h1 className="text-headline-sm text-on-background">Audit Trail</h1>
          <div className="text-body-sm text-on-surface-variant mt-1">
            Full history of every status change, assignment, and mobilisation
            event.
          </div>
        </div>
        <div className="flex items-center gap-2 w-[280px] px-3 py-1.5 rounded border border-outline-variant bg-surface-container-low text-outline">
          <Search size={15} className="shrink-0" />
          <input
            type="text"
            placeholder="Search name, site, reason…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-body-sm text-on-surface w-full placeholder:text-outline"
          />
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="text-center text-outline text-body-sm py-8">
            Loading audit trail…
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {[
                  "Timestamp",
                  "Employee",
                  "Transition",
                  "Site",
                  "Reason",
                  "Authorized By",
                  "Updated By",
                ].map((h) => (
                  <th key={h} className={th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l._id} className="hover:bg-surface-container-low">
                  <td className={`${td} font-mono-data text-[11px] whitespace-nowrap`}>
                    {fmt(l.createdAt)}
                  </td>
                  <td className={td}>
                    <div className="font-semibold text-on-surface text-body-sm">
                      {l.employeeName}
                    </div>
                  </td>
                  <td className={td}>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={l.previousStatus} />
                      <span className="text-outline text-[11px]">→</span>
                      <StatusBadge status={l.newStatus} />
                    </div>
                  </td>
                  <td className={`${td} text-body-sm`}>
                    {l.previousSite && l.previousSite !== l.newSite ? (
                      <span className="text-on-surface-variant">
                        {l.previousSite} →{" "}
                      </span>
                    ) : null}
                    <b className="text-on-surface font-semibold">{l.newSite}</b>
                  </td>
                  <td className={`${td} text-body-sm text-on-surface-variant max-w-[220px]`}>
                    {l.reasonForChange}
                  </td>
                  <td className={`${td} text-body-sm`}>{l.authorizedBy}</td>
                  <td className={`${td} text-body-sm text-outline`}>
                    {l.updatedByUserId?.name || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center text-outline text-body-sm py-8">
            No audit records match the search.
          </div>
        )}
      </div>
    </div>
  );
}
