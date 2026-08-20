import { useQueryClient } from "@tanstack/react-query";
import { Users, UserPlus, X } from "lucide-react";
import { useState } from "react";
import useDashboardStore, { STAGES } from "../../store/useDashboardStore";
import { isMobReady } from "../manpower/employeeUtils";

function docLevel(doc) {
  if (!doc?.number && !doc?.expiry) return "gray";
  if (!doc.expiry) return "green";
  const now = new Date();
  const d = new Date(doc.expiry);
  if (d < now) return "red";
  const soon = new Date();
  soon.setDate(now.getDate() + 30);
  if (d < soon) return "yellow";
  return "green";
}

const CERT_TEXT = {
  green: "text-green-600",
  yellow: "text-amber-600",
  red: "text-error",
  gray: "text-outline",
};

export default function SuggestDrawer() {
  const { open, joId, slotId } = useDashboardStore((s) => s.ui.drawer);
  const closeDrawer = useDashboardStore((s) => s.closeDrawer);
  const openAssignAudit = useDashboardStore((s) => s.openAssignAudit);
  const openAssignExternalAudit = useDashboardStore(
    (s) => s.openAssignExternalAudit,
  );

  const [tab, setTab] = useState("INTERNAL"); // 'INTERNAL' | 'EXTERNAL'
  const [extName, setExtName] = useState("");
  const [extCompany, setExtCompany] = useState("");
  const [extContact, setExtContact] = useState("");
  const [extError, setExtError] = useState("");
  const [assignStatus, setAssignStatus] = useState("RESERVED");

  const qc = useQueryClient();
  const jobOrders = qc.getQueryData(["jobOrders"]) || [];
  const jo = open ? jobOrders.find((j) => j._id === joId) : null;
  const slot = jo ? jo.slots.find((s) => s._id === slotId) : null;

  if (!open || !slot) return null;

  const allEmployees = qc.getQueryData(["employees"])?.employees || [];
  const candidates = allEmployees.filter(
    (e) => e.trade === slot.trade && e.status === "AVAILABLE" && isMobReady(e),
  );
  const shown = candidates.slice(0, 4);

  const handleAssignExternal = (e) => {
    e.preventDefault();
    if (!extName.trim()) {
      setExtError("Worker name is required.");
      return;
    }
    setExtError("");
    openAssignExternalAudit(
      joId,
      slotId,
      {
        name: extName.trim(),
        company: extCompany.trim() || undefined,
        contactNumber: extContact.trim() || undefined,
      },
      slot.trade,
      assignStatus,
    );
  };

  return (
    <div
      className="absolute w-72 bg-surface-container-lowest border border-outline-variant shadow-[0_4px_16px_rgba(15,23,42,0.14)] rounded-lg z-50 p-3"
      style={{ top: "35%", right: 24 }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-outline-variant">
        <div>
          <span className="text-label-sm uppercase tracking-wider font-semibold text-on-surface block">
            Slot {slot.slotNumber} · {slot.trade}
          </span>
          <span className="text-[11px] text-on-surface-variant">
            {jo.siteName}
          </span>
        </div>
        <button
          className="text-on-surface-variant hover:text-on-surface p-1"
          onClick={closeDrawer}
        >
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex rounded bg-surface-container-low p-0.5 mb-2.5">
        <button
          type="button"
          onClick={() => setTab("INTERNAL")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-[11px] font-semibold rounded transition-colors ${
            tab === "INTERNAL"
              ? "bg-surface-container-lowest text-on-surface shadow-xs"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <Users size={12} /> Company
        </button>
        <button
          type="button"
          onClick={() => setTab("EXTERNAL")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-[11px] font-semibold rounded transition-colors ${
            tab === "EXTERNAL"
              ? "bg-surface-container-lowest text-on-surface shadow-xs"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <UserPlus size={12} /> Subcontractor
        </button>
      </div>

      {/* Status Dropdown */}
      <div className="mb-2">
        <label className="text-[11px] font-medium text-on-surface block mb-1">
          Assign As
        </label>
        <select
          value={assignStatus}
          onChange={(e) => setAssignStatus(e.target.value)}
          className="w-full h-8 px-2 text-body-sm border border-outline-variant rounded bg-surface-container-lowest focus:border-primary focus:outline-none"
        >
          {STAGES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {tab === "INTERNAL" ? (
        <>
          {shown.length === 0 ? (
            <div className="text-center text-outline text-body-sm py-4">
              No available {slot.trade.toLowerCase()}s with valid HSE Passport
              and CICPA Pass on record.
            </div>
          ) : (
            <div className="space-y-1">
              {shown.map((c) => {
                const hseLvl = docLevel(c.documents?.hsePassport);
                const cicpaLvl = docLevel(c.documents?.cicpaPass);
                const worst =
                  hseLvl === "red" || cicpaLvl === "red"
                    ? "red"
                    : hseLvl === "yellow" || cicpaLvl === "yellow"
                      ? "yellow"
                      : "green";
                return (
                  <div
                    key={c._id}
                    className="flex justify-between items-center p-2 hover:bg-surface-container-low rounded cursor-pointer group border border-transparent hover:border-outline-variant"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 bg-surface-container-high rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                        {c.name
                          ?.split(" ")
                          .map((p) => p[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-label-sm text-on-surface truncate">
                          {c.name}
                        </div>
                        <div
                          className={`font-mono-data text-[9px] ${CERT_TEXT[worst]}`}
                        >
                          HSE &amp; CICPA {worst === "green" ? "valid" : "check"}
                        </div>
                      </div>
                    </div>
                    <button
                      className="w-6 h-6 bg-surface border border-outline-variant rounded flex items-center justify-center shrink-0 group-hover:bg-primary-container group-hover:text-on-primary group-hover:border-primary-container transition-colors"
                      onClick={() => openAssignAudit(joId, slotId, c, assignStatus)}
                      title={`Assign ${c.name}`}
                    >
                      +
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {candidates.length > shown.length && (
            <div className="mt-2 pt-2 border-t border-outline-variant text-center text-label-sm text-on-surface-variant">
              +{candidates.length - shown.length} more available
            </div>
          )}
        </>
      ) : (
        /* External Subcontractor Form */
        <form onSubmit={handleAssignExternal} className="flex flex-col gap-2">
          {extError && (
            <div className="p-1.5 rounded text-[11px] bg-error-container/40 text-on-error-container">
              {extError}
            </div>
          )}
          <div>
            <label className="text-[11px] font-medium text-on-surface block mb-1">
              Worker Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rajesh Kumar"
              value={extName}
              onChange={(e) => setExtName(e.target.value)}
              className="w-full h-8 px-2 text-body-sm border border-outline-variant rounded bg-surface-container-lowest focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-on-surface block mb-1">
              Subcontractor / Agency
            </label>
            <input
              type="text"
              placeholder="e.g. Apex Manpower LLC"
              value={extCompany}
              onChange={(e) => setExtCompany(e.target.value)}
              className="w-full h-8 px-2 text-body-sm border border-outline-variant rounded bg-surface-container-lowest focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-on-surface block mb-1">
              Contact / Reference ID (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. +971-50-1234567"
              value={extContact}
              onChange={(e) => setExtContact(e.target.value)}
              className="w-full h-8 px-2 text-body-sm border border-outline-variant rounded bg-surface-container-lowest focus:border-primary focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full h-8 mt-1 rounded bg-primary-container text-on-primary text-label-sm font-semibold hover:bg-primary transition-colors flex items-center justify-center gap-1"
          >
            <UserPlus size={13} /> Assign Subcontractor
          </button>
        </form>
      )}
    </div>
  );
}
