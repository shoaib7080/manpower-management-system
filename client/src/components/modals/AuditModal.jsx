// client/src/components/modals/AuditModal.jsx
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getStaff } from "../../api/services";
import useDashboardStore, { STAGES } from "../../store/useDashboardStore";
import StatusBadge from "../StatusBadge";
import {
  Field,
  ModalBody,
  ModalFoot,
  ModalHead,
  ModalShell,
  Overlay,
  btnDangerOutline,
  btnGhost,
  btnPrimary,
  inputCls,
} from "../ui/Modal";

export default function AuditModal({ onConfirm }) {
  const { open, pending } = useDashboardStore((s) => s.ui.audit);
  const closeAuditModal = useDashboardStore((s) => s.closeAuditModal);

  const [reason, setReason] = useState("");
  const [authBy, setAuthBy] = useState("");
  const [targetStatus, setTargetStatus] = useState("");
  const [mobDate, setMobDate] = useState("");
  const [demobDate, setDemobDate] = useState("");
  const [releaseConfirmed, setReleaseConfirmed] = useState(false);

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: () => getStaff().then((r) => r.data),
    enabled: open,
  });

  useEffect(() => {
    if (open && pending) {
      setReason("");
      setAuthBy("");
      setTargetStatus(pending.to || "RESERVED");
      setMobDate("");
      setDemobDate(new Date().toISOString().split("T")[0]);
      setReleaseConfirmed(false);
    }
  }, [open, pending]);

  if (!open || !pending) return null;

  const isAssignOrAdvance =
    pending.action?.type === "assign" || pending.action?.type === "advance";
  const isRelease = pending.action?.type === "release";

  const displayTo = isAssignOrAdvance ? targetStatus : pending.to;

  const currentIdx = STAGES.indexOf(pending.from);
  const availableStatuses = isAssignOrAdvance
    ? pending.from === "AVAILABLE" || pending.from === "UNASSIGNED"
      ? STAGES
      : STAGES.slice(currentIdx + 1)
    : [];

  const demobDateValid =
    !demobDate ||
    !pending.mobDate ||
    new Date(demobDate) >= new Date(pending.mobDate);

  const canSave =
    reason.trim().length > 0 &&
    authBy !== "" &&
    (!isRelease || (releaseConfirmed && demobDateValid));

  const handleSave = () => {
    const auditData = {
      pending: {
        ...pending,
        to: displayTo,
        action: { ...pending.action, targetStatus: displayTo },
      },
      reasonForChange: reason,
      authorizedBy: authBy,
    };
    if (mobDate) auditData.mobDate = mobDate;
    if (isRelease) auditData.demobDate = demobDate;
    onConfirm(auditData);
  };

  return (
    <Overlay onBackdropClick={closeAuditModal}>
      <ModalShell width={isRelease ? 540 : 520}>
        {isRelease ? (
          <div className="px-[18px] py-3.5 border-b border-error/40 flex justify-between items-start bg-error-container/20">
            <div className="flex items-center gap-2">
              <span className="text-error text-base">⚠</span>
              <h3 className="text-body-lg font-semibold text-error">
                Release Worker
              </h3>
            </div>
            <button
              type="button"
              onClick={closeAuditModal}
              className="text-error/60 text-base leading-none p-0.5 hover:text-error"
            >
              ✕
            </button>
          </div>
        ) : (
          <ModalHead title="Confirm Status Change" onClose={closeAuditModal} />
        )}

        <ModalBody>
          {isRelease && (
            <div className="border border-error/30 rounded-lg bg-error-container/10 px-3.5 py-3 mb-4">
              <p className="text-label-sm font-bold uppercase text-error mb-1 tracking-wide">
                ⚠ Danger Zone
              </p>
              <p className="text-body-sm text-on-surface-variant">
                This action will permanently demobilize{" "}
                <b className="text-on-surface">{pending.workerName}</b> and
                clear their slot. This cannot be undone without re-assigning.
              </p>
            </div>
          )}

          <div className="text-body-sm text-on-surface-variant mb-3">
            Worker:{" "}
            <b className="text-on-surface font-semibold">
              {pending.workerName}
            </b>{" "}
            · <span className="font-mono-data">{pending.workerTrade}</span>
          </div>

          <div className="flex items-center justify-center gap-2.5 bg-surface-container-low border border-outline-variant rounded px-3 py-2.5 mb-3.5">
            <StatusBadge status={pending.from} />
            <span className="text-outline text-label-md">→</span>
            <StatusBadge status={displayTo} />
          </div>

          {isAssignOrAdvance && availableStatuses.length > 0 && (
            <Field label="Target Status" required>
              <select
                className={inputCls}
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
              >
                {availableStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {isAssignOrAdvance && targetStatus === "MOBILIZED" && (
            <Field label="Mobilized Date" hint="(leave blank for today)">
              <input
                type="date"
                className={inputCls}
                value={mobDate}
                onChange={(e) => setMobDate(e.target.value)}
              />
            </Field>
          )}

          {isRelease && (
            <Field
              label="Actual Demobilization Date"
              hint="(defaults to today)"
            >
              <input
                type="date"
                className={inputCls}
                value={demobDate}
                onChange={(e) => setDemobDate(e.target.value)}
              />
              {!demobDateValid && (
                <p className="text-error text-label-sm mt-1">
                  Demob date cannot be before the original mobilization date.
                </p>
              )}
            </Field>
          )}

          <Field label="Reason for Change" required>
            <textarea
              rows={3}
              className={inputCls}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Client confirmed headcount, mobilizing per site schedule…"
            />
          </Field>

          <Field label="Authorized By" required>
            <select
              className={inputCls}
              value={authBy}
              onChange={(e) => setAuthBy(e.target.value)}
            >
              <option value="">Select engineer / manager…</option>
              {staffList.map((s) => (
                <option key={s._id} value={`${s.name} — ${s.designation}`}>
                  {s.name} — {s.designation}
                </option>
              ))}
            </select>
          </Field>

          {isRelease && (
            <label className="flex items-start gap-2.5 cursor-pointer mt-1">
              <input
                type="checkbox"
                className="mt-0.5 accent-error"
                checked={releaseConfirmed}
                onChange={(e) => setReleaseConfirmed(e.target.checked)}
              />
              <span className="text-body-sm text-on-surface-variant leading-snug">
                I confirm that this worker has physically completed / departed
                their assignment at this site.
              </span>
            </label>
          )}
        </ModalBody>

        <ModalFoot>
          <button className={btnGhost} onClick={closeAuditModal}>
            Cancel
          </button>
          {isRelease ? (
            <button
              className={btnDangerOutline}
              disabled={!canSave}
              onClick={handleSave}
            >
              Confirm Release
            </button>
          ) : (
            <button
              className={btnPrimary}
              disabled={!canSave}
              onClick={handleSave}
            >
              Save Change
            </button>
          )}
        </ModalFoot>
      </ModalShell>
    </Overlay>
  );
}
