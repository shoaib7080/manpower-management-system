import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { uploadJobOrderExcel } from "../../api/services";

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

const th = {
  textAlign: "left",
  padding: "7px 10px",
  fontSize: 10.5,
  fontWeight: 600,
  color: "var(--text-2)",
  borderBottom: "1px solid var(--line)",
  whiteSpace: "nowrap",
};
const td = {
  padding: "7px 10px",
  borderBottom: "1px solid var(--line)",
  verticalAlign: "top",
  lineHeight: 1.5,
};

function ColTable({ rows }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
      <thead>
        <tr style={{ background: "var(--paper)" }}>
          <th style={th}>Column Header</th>
          <th style={th}>Accepted Alternatives</th>
          <th style={th}>Notes</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.col}>
            <td style={td}>
              <span className="mono" style={{ fontSize: 11 }}>
                {r.col}
              </span>
            </td>
            <td style={{ ...td, color: "var(--text-2)" }}>
              {r.alt ? (
                <span className="mono" style={{ fontSize: 10.5 }}>
                  {r.alt}
                </span>
              ) : (
                "—"
              )}
            </td>
            <td style={{ ...td, color: "var(--text-2)" }}>{r.note || "—"}</td>
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
    <div
      className="overlay show"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal" style={{ width: 600 }}>
        <div className="modal-head">
          <h3>Import Job Orders from Excel</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div
          className="modal-body"
          style={{ maxHeight: "68vh", overflowY: "auto" }}
        >
          <p
            style={{
              fontSize: 12,
              color: "var(--text-2)",
              marginBottom: 14,
              lineHeight: 1.6,
            }}
          >
            Each row represents one job order. Slots are auto-generated from the
            trade quantity columns. Rows with a duplicate{" "}
            <span className="mono" style={{ fontSize: 11 }}>
              Job Order Number
            </span>{" "}
            are skipped.
            <b> Project Engineer</b> column is optional — defaults to <i>TBD</i>{" "}
            if omitted.
          </p>

          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: "var(--text-2)",
                marginBottom: 7,
                letterSpacing: ".03em",
              }}
            >
              REQUIRED COLUMNS
            </div>
            <div
              style={{
                border: "1px solid var(--line)",
                borderRadius: "var(--radius)",
                overflow: "hidden",
              }}
            >
              <ColTable rows={REQUIRED_COLS} />
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: "var(--text-2)",
                marginBottom: 7,
                letterSpacing: ".03em",
              }}
            >
              TRADE QUANTITY COLUMNS (at least one required)
            </div>
            <div
              style={{
                border: "1px solid var(--line)",
                borderRadius: "var(--radius)",
                overflow: "hidden",
              }}
            >
              <ColTable rows={TRADE_COLS} />
            </div>
          </div>

          <div
            style={{
              background: "var(--yellow-bg)",
              borderLeft: "3px solid var(--yellow)",
              borderRadius: "var(--radius)",
              padding: "10px 12px",
              fontSize: 11.5,
              color: "var(--ink)",
              lineHeight: 1.6,
              marginBottom: 4,
            }}
          >
            <b>Dates:</b> use{" "}
            <span className="mono" style={{ fontSize: 11 }}>
              DD/MM/YYYY
            </span>{" "}
            or Excel date cells. Demob date is auto-calculated as{" "}
            <b>start date + 90 days</b>. Rows missing Job Order Number, Site
            Name, Client Category, Start Date, or all trade quantities are
            skipped.
          </div>

          {result && (
            <div
              style={{
                marginTop: 14,
                padding: "10px 13px",
                borderRadius: "var(--radius)",
                fontSize: 12,
                background: result.ok ? "var(--green-bg)" : "var(--red-bg)",
                borderLeft: `3px solid ${result.ok ? "var(--green)" : "var(--red)"}`,
                color: result.ok ? "var(--green)" : "var(--red)",
              }}
            >
              {result.ok ? (
                <>
                  <b>Import successful.</b> {result.processed} job order
                  {result.processed !== 1 ? "s" : ""} created
                  {result.skipped > 0 &&
                    `, ${result.skipped} row${result.skipped !== 1 ? "s" : ""} skipped`}
                  .
                  {result.errors?.length > 0 && (
                    <ul
                      style={{
                        marginTop: 6,
                        paddingLeft: 16,
                        color: "var(--text-2)",
                      }}
                    >
                      {result.errors.map((e, i) => (
                        <li key={i} style={{ fontSize: 11 }}>
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

        <div className="modal-foot" style={{ justifyContent: "space-between" }}>
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
          <button
            className="btn btn-primary"
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
            style={{ display: "none" }}
          />
        </div>
      </div>
    </div>
  );
}
