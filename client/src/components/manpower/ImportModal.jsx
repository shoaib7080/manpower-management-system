import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { uploadExcel } from "../../api/services";
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
    col: "Employee ID",
    alt: "EMP_ID  or  EmployeeNo",
    req: true,
    note: "Unique identifier — used for upsert",
  },
  { col: "Full Name", alt: "Name  or  Employee Name", req: true, note: "" },
  {
    col: "Trade",
    alt: "Designation",
    req: false,
    note: "Supervisor / Fabricator / Welder / Fitter / Rigger / Helper / Other",
  },
];

const OPTIONAL_COLS = [
  { col: "DOB", alt: "Date of Birth", note: "DD/MM/YYYY or Excel date serial" },
  { col: "Emirates ID", alt: "", note: "UAE residents — 784-XXXX-XXXXXXX-X" },
  { col: "Passport Number", alt: "", note: "Non-UAE residents" },
  { col: "ADNOC Induction Expiry", alt: "", note: "Date format" },
  { col: "H2S Training Expiry", alt: "H2S Expiry", note: "Date format" },
  { col: "Medical Expiry", alt: "", note: "Date format" },
  { col: "Sea Survival Expiry", alt: "", note: "Date format — offshore only" },
  {
    col: "HSE Passport Number",
    alt: "HSE Passport No",
    note: "Document number — gates mobilization",
  },
  {
    col: "HSE Passport Expiry",
    alt: "",
    note: "Date format — either number or expiry is sufficient",
  },
  {
    col: "CICPA Number",
    alt: "CICPA Pass No  or  CICPA No",
    note: "Document number — gates mobilization",
  },
  {
    col: "CICPA Expiry",
    alt: "CICPA Pass Expiry",
    note: "Date format — either number or expiry is sufficient",
  },
];

const th =
  "text-left px-2.5 py-1.5 text-[10.5px] font-semibold text-on-surface-variant border-b border-outline-variant whitespace-nowrap bg-surface-container-low";
const td =
  "px-2.5 py-1.5 border-b border-outline-variant align-top leading-relaxed text-[12px]";

function ColTable({ rows, required }) {
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
              {required && r.req && (
                <span className="text-error ml-1 text-[10px]">*</span>
              )}
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

export default function ImportModal({ onClose }) {
  const qc = useQueryClient();
  const fileRef = useRef(null);
  const [result, setResult] = useState(null);

  const mutation = useMutation({
    mutationFn: (fd) => uploadExcel(fd),
    onSuccess: (res) => {
      qc.invalidateQueries(["employees"]);
      setResult({
        ok: true,
        message: res.data.message,
        processed: res.data.processedCount,
        skipped: res.data.skippedCount,
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
      <ModalShell width={580}>
        <ModalHead title="Import Excel Data" onClose={onClose} />

        <div className="px-[18px] py-4 max-h-[68vh] overflow-y-auto">
          <p className="text-body-sm text-on-surface-variant mb-3.5 leading-relaxed">
            Your file must use the <b>first sheet</b> with column headers
            exactly as listed below. Column order does not matter. Existing
            records are matched and updated by{" "}
            <span className="font-mono-data text-[11px]">Employee ID</span>{" "}
            (upsert).
          </p>

          <div className="mb-3.5">
            <div className="text-[10.5px] font-semibold text-on-surface-variant mb-1.5 tracking-wide">
              REQUIRED COLUMNS
            </div>
            <div className="border border-outline-variant rounded overflow-hidden">
              <ColTable rows={REQUIRED_COLS} required />
            </div>
          </div>

          <div className="mb-4">
            <div className="text-[10.5px] font-semibold text-on-surface-variant mb-1.5 tracking-wide">
              OPTIONAL COLUMNS
            </div>
            <div className="border border-outline-variant rounded overflow-hidden">
              <ColTable rows={OPTIONAL_COLS} />
            </div>
          </div>

          <div className="bg-amber-50 border-l-[3px] border-amber-500 rounded px-3 py-2.5 text-[11.5px] text-on-background leading-relaxed mb-1">
            <b>Dates:</b>{" "}
            <span className="font-mono-data text-[11px]">DD/MM/YYYY</span> or
            leave as an Excel date cell. All imported employees default to{" "}
            <b>AVAILABLE</b> status. Rows missing both Employee ID and Full Name
            are skipped automatically.
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
                  <b>Import successful.</b> {result.processed} record
                  {result.processed !== 1 ? "s" : ""} processed
                  {result.skipped > 0 &&
                    `, ${result.skipped} row${result.skipped !== 1 ? "s" : ""} skipped (missing required fields)`}
                  .
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
