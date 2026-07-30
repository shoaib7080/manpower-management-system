import { useQuery } from "@tanstack/react-query";
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
      <div className="topbar">
        <div>
          <h1>Audit Trail</h1>
          <div className="sub">
            Full history of every status change, assignment, and mobilisation
            event.
          </div>
        </div>
        <input
          className="ff"
          type="text"
          placeholder="Search name, site, reason…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 260 }}
        />
      </div>

      <div className="table-wrap">
        {isLoading ? (
          <div className="empty-state">Loading audit trail…</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Employee</th>
                <th>Transition</th>
                <th>Site</th>
                <th>Reason</th>
                <th>Authorized By</th>
                <th>Updated By</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l._id}>
                  <td
                    className="mono"
                    style={{ fontSize: 11, whiteSpace: "nowrap" }}
                  >
                    {fmt(l.createdAt)}
                  </td>
                  <td>
                    <div className="emp-name">{l.employeeName}</div>
                  </td>
                  <td>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <StatusBadge status={l.previousStatus} />
                      <span style={{ color: "var(--text-3)", fontSize: 11 }}>
                        →
                      </span>
                      <StatusBadge status={l.newStatus} />
                    </div>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {l.previousSite && l.previousSite !== l.newSite ? (
                      <span style={{ color: "var(--text-2)" }}>
                        {l.previousSite} →{" "}
                      </span>
                    ) : null}
                    <b>{l.newSite}</b>
                  </td>
                  <td
                    style={{
                      fontSize: 12,
                      maxWidth: 220,
                      color: "var(--text-2)",
                    }}
                  >
                    {l.reasonForChange}
                  </td>
                  <td style={{ fontSize: 12 }}>{l.authorizedBy}</td>
                  <td style={{ fontSize: 12, color: "var(--text-3)" }}>
                    {l.updatedByUserId?.name || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="empty-state">No audit records match the search.</div>
        )}
      </div>
    </div>
  );
}
