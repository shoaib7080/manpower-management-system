import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { uploadJobOrderExcel } from "../../api/services";
import {
  ModalFoot,
  ModalHead,
  ModalShell,
  Overlay,
  btnGhost,
  btnPrimary,
} from "../ui/Modal";

const REQUIRED_COLS = [
  {
    col: "Job Order Number",
    alt: "JO Number  or  JobOrderNo",
    note: "Unique — duplicate JOs are skipped",
  },
  { col: "Site Name", alt: "Site", note: "" },
  {
    col: "Client Category",
    alt: "Client",
    note: "ADNOC Onshore / ADNOC Offshore / Internal Production / Other",
  },
  {
    col: "Start Date",
    alt: "Mob Date",
    note: "DD/MM/YYYY or Excel date serial",
  },
];

// This mirrors the backend's fixed TRADE_COLS in jobOrderController.js
// exactly — it documents the real Excel contract, not a UI choice list.
// Don't expand this to match the full TRADES set without updating the
// backend import logic first.
const TRADE_COLS = [
  {
    col: "Supervisor",
    alt: "",
    note: "Number of Supervisor slots to generate",
  },
  { col: "Foreman", alt: "", note: "" },
  { col: "Fabricator", alt: "", note: "" },
  { col: "Welder", alt: "", note: "" },
  { col: "Fitter", alt: "", note: "" },
  { col: "Rigger", alt: "", note: "" },
  { col: "Helper", alt: "", note: "" },
  { col: "Other", alt: "", note: "" },
];

const th =
  "text-left px-2.5 py-1.5 text-[10.5px] font-semibold text-on-surface-variant border-b border-outline-variant whitespace-nowrap bg-surface-container-low";
const td =
  "px-2.5 py-1.5 border-b border-outline-variant align-top leading-relaxed text-[12px]";

function ColTable({ rows }) {
  return (
    <table className="w-full border-collapse text-[12px]">
      <thead>
        <tr>
          <th className={th}>Column Header</th>
          <th className={th}>Accepted Alternatives</th>
          <th className={th}>Notes</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.col}>
            <td className={td}>
              <span className="font-mono-data text-[11px]">{r.col}</span>
            </td>
            <td className={`${td} text-on-surface-variant`}>
              {r.alt ? (
                <span className="font-mono-data text-[10.5px]">{r.alt}</span>
              ) : (
                "—"
              )}
            </td>
            <td className={`${td} text-on-surface-variant`}>{r.note || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function JobOrderImportModal({ onClose }) {
  const qc = useQueryClient();
  const fileRef = useRef(null);
  const [result, setResult] = useState(null);

  const mutation = useMutation({
    mutationFn: (fd) => uploadJobOrderExcel(fd),
    onSuccess: (res) => {
      qc.invalidateQueries(["jobOrders"]);
      setResult({
        ok: true,
        message: res.data.message,
        processed: res.data.processedCount,
        skipped: res.data.skippedCount,
        skippedRows: res.data.skipped || [],
        errors: res.data.errors || [],
      });
    },
    onError: (err) => {
      setResult({
        ok: false,
        message:
          err.response?.data?.message ||
          "Upload failed. Please check the file and try again.",
      });
    },
  });

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setResult(null);
    const fd = new FormData();
    fd.append("file", file);
    mutation.mutate(fd);
    e.target.value = "";
  };

  return (
    <Overlay onBackdropClick={onClose}>
      <ModalShell width={600}>
        <ModalHead title="Import Job Orders from Excel" onClose={onClose} />

        <div className="px-[18px] py-4 max-h-[68vh] overflow-y-auto">
          <p className="text-body-sm text-on-surface-variant mb-3.5 leading-relaxed">
            Each row represents one job order. Slots are auto-generated from the
            trade quantity columns. Rows with a duplicate{" "}
            <span className="font-mono-data text-[11px]">Job Order Number</span>{" "}
            are skipped.
            <b> Project Engineer</b> column is optional — defaults to <i>TBD</i>{" "}
            if omitted.
          </p>

          <div className="mb-3.5">
            <div className="text-[10.5px] font-semibold text-on-surface-variant mb-1.5 tracking-wide">
              REQUIRED COLUMNS
            </div>
            <div className="border border-outline-variant rounded overflow-hidden">
              <ColTable rows={REQUIRED_COLS} />
            </div>
          </div>

          <div className="mb-4">
            <div className="text-[10.5px] font-semibold text-on-surface-variant mb-1.5 tracking-wide">
              TRADE QUANTITY COLUMNS (at least one required)
            </div>
            <div className="border border-outline-variant rounded overflow-hidden">
              <ColTable rows={TRADE_COLS} />
            </div>
          </div>

          <div className="bg-amber-50 border-l-[3px] border-amber-500 rounded px-3 py-2.5 text-[11.5px] text-on-background leading-relaxed mb-1">
            <b>Dates:</b>{" "}
            <span className="font-mono-data text-[11px]">DD/MM/YYYY</span> or
            Excel date cells. Demob date is auto-calculated as{" "}
            <b>start date + 90 days</b>. Rows missing Job Order Number, Site
            Name, Client Category, Start Date, or all trade quantities are
            skipped.
          </div>

          {result && (
            <div
              className={`mt-3.5 px-3.5 py-2.5 rounded text-body-sm border-l-[3px] ${
                result.ok
                  ? "bg-green-50 border-green-500 text-green-800"
                  : "bg-error-container/40 border-error text-on-error-container"
              }`}
            >
              {result.ok ? (
                <>
                  <b>Import successful.</b> {result.processed} job order
                  {result.processed !== 1 ? "s" : ""} created
                  {result.skipped > 0 &&
                    `, ${result.skipped} row${result.skipped !== 1 ? "s" : ""} skipped`}
                  .
                  {result.skippedRows?.length > 0 && (
                    <ul className="mt-1.5 pl-4 text-amber-700 list-disc">
                      {result.skippedRows.map((e, i) => (
                        <li key={i} className="text-[11px]">
                          {e}
                        </li>
                      ))}
                    </ul>
                  )}
                  {result.errors?.length > 0 && (
                    <ul className="mt-1.5 pl-4 text-error list-disc">
                      {result.errors.map((e, i) => (
                        <li key={i} className="text-[11px]">
                          {e}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <>
                  <b>Error:</b> {result.message}
                </>
              )}
            </div>
          )}
        </div>

        <ModalFoot>
          <div className="flex justify-between items-center w-full">
            <button className={btnGhost} onClick={onClose}>
              Close
            </button>
            <button
              className={btnPrimary}
              disabled={mutation.isPending}
              onClick={() => fileRef.current?.click()}
            >
              {mutation.isPending ? "Uploading…" : "↑ Choose File & Upload"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFile}
              className="hidden"
            />
          </div>
        </ModalFoot>
      </ModalShell>
    </Overlay>
  );
}
