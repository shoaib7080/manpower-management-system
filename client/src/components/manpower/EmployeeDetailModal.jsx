import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  deleteEmployee as deleteEmployeeApi,
  updateEmployee as updateEmployeeApi,
} from "../../api/services";
import ComplianceDot from "../ComplianceDot";
import {
  EMP_STATUSES,
  getLevel,
  isMobReady,
  toDateInput,
} from "./employeeUtils";

const fieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  marginBottom: 12,
};
const labelStyle = { fontSize: 11, color: "var(--text-2)", fontWeight: 600 };
const inputStyle = {
  padding: "6px 8px",
  borderRadius: 4,
  border: "1px solid var(--line)",
  fontSize: 13,
  background: "var(--paper)",
  color: "var(--ink)",
};
const sectionStyle = {
  fontSize: 11,
  fontWeight: 700,
  color: "var(--text-3)",
  letterSpacing: ".05em",
  margin: "16px 0 8px",
  textTransform: "uppercase",
};

function DocCell({ doc }) {
  const has = !!(doc?.number || doc?.expiry);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span
        className="mono"
        style={{ fontSize: 10.5, color: has ? "var(--ink)" : "var(--text-3)" }}
      >
        {doc?.number || "—"}
      </span>
      <ComplianceDot level={!has ? "gray" : getLevel(doc?.expiry)} />
    </div>
  );
}

export default function EmployeeDetailModal({ emp, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: emp.name || "",
    trade: emp.trade || "",
    status: emp.status || "AVAILABLE",
    dob: toDateInput(emp.dob),
    emiratesId: emp.emiratesId || "",
    passportNumber: emp.passportNumber || "",
    trainings: {
      adnocInductionExpiry: toDateInput(emp.trainings?.adnocInductionExpiry),
      h2sExpiry: toDateInput(emp.trainings?.h2sExpiry),
      medicalExpiry: toDateInput(emp.trainings?.medicalExpiry),
      seaSurvivalExpiry: toDateInput(emp.trainings?.seaSurvivalExpiry),
    },
    documents: {
      hsePassport: {
        number: emp.documents?.hsePassport?.number || "",
        expiry: toDateInput(emp.documents?.hsePassport?.expiry),
      },
      cicpaPass: {
        number: emp.documents?.cicpaPass?.number || "",
        expiry: toDateInput(emp.documents?.cicpaPass?.expiry),
      },
    },
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  const set = (path, val) =>
    setForm((prev) => {
      const next = { ...prev };
      const keys = path.split(".");
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = { ...cur[keys[i]] };
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = val;
      return next;
    });

  const updateMutation = useMutation({
    mutationFn: (payload) => updateEmployeeApi(emp._id, payload),
    onSuccess: () => {
      qc.invalidateQueries(["employees"]);
      onClose();
    },
    onError: (e) => setError(e.response?.data?.message || "Update failed."),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteEmployeeApi(emp._id),
    onSuccess: () => {
      qc.invalidateQueries(["employees"]);
      onClose();
    },
    onError: (e) => setError(e.response?.data?.message || "Delete failed."),
  });

  return (
    <div
      className="overlay show"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal"
        style={{
          maxWidth: 520,
          maxHeight: "85vh",
          overflowY: "auto",
          scrollbarWidth: "none",
        }}
      >
        {!isMobReady(emp) && (
          <div
            style={{
              padding: "8px 12px",
              fontSize: 12,
              background: "var(--red-bg)",
              color: "var(--red)",
              margin: "8px 12px",
              borderRadius: 4,
            }}
          >
            ⚠ Not assignable — missing valid HSE Passport or CICPA Pass. Update
            the document fields below and save.
          </div>
        )}
        <div className="modal-head">
          <h3>Edit — {emp.name}</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          {error && (
            <div
              style={{ color: "var(--red)", fontSize: 12, marginBottom: 10 }}
            >
              {error}
            </div>
          )}

          <div style={sectionStyle}>Identity</div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <div style={fieldStyle}>
              <label style={labelStyle}>Employee ID (read-only)</label>
              <input
                style={{ ...inputStyle, opacity: 0.5 }}
                value={emp.employeeId}
                disabled
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Full Name *</label>
              <input
                style={inputStyle}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Trade *</label>
              <input
                style={inputStyle}
                value={form.trade}
                onChange={(e) => set("trade", e.target.value)}
              ></input>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Status</label>
              <select
                style={inputStyle}
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                {EMP_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Date of Birth</label>
              <input
                type="date"
                style={inputStyle}
                value={form.dob}
                onChange={(e) => set("dob", e.target.value)}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Emirates ID</label>
              <input
                style={inputStyle}
                value={form.emiratesId}
                onChange={(e) => set("emiratesId", e.target.value)}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Passport Number</label>
              <input
                style={inputStyle}
                value={form.passportNumber}
                onChange={(e) => set("passportNumber", e.target.value)}
              />
            </div>
          </div>

          <div style={sectionStyle}>Documents</div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <div style={fieldStyle}>
              <label style={labelStyle}>HSE Passport No.</label>
              <input
                style={inputStyle}
                value={form.documents.hsePassport.number}
                onChange={(e) =>
                  set("documents.hsePassport.number", e.target.value)
                }
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>HSE Passport Expiry</label>
              <input
                type="date"
                style={inputStyle}
                value={form.documents.hsePassport.expiry}
                onChange={(e) =>
                  set("documents.hsePassport.expiry", e.target.value)
                }
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>CICPA No.</label>
              <input
                style={inputStyle}
                value={form.documents.cicpaPass.number}
                onChange={(e) =>
                  set("documents.cicpaPass.number", e.target.value)
                }
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>CICPA Expiry</label>
              <input
                type="date"
                style={inputStyle}
                value={form.documents.cicpaPass.expiry}
                onChange={(e) =>
                  set("documents.cicpaPass.expiry", e.target.value)
                }
              />
            </div>
          </div>

          <div style={sectionStyle}>Trainings</div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            {[
              ["ADNOC Induction Expiry", "trainings.adnocInductionExpiry"],
              ["H2S Expiry", "trainings.h2sExpiry"],
              ["Medical Expiry", "trainings.medicalExpiry"],
              ["Sea Survival Expiry", "trainings.seaSurvivalExpiry"],
            ].map(([label, path]) => (
              <div key={path} style={fieldStyle}>
                <label style={labelStyle}>{label}</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={path.split(".").reduce((o, k) => o?.[k], form) || ""}
                  onChange={(e) => set(path, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="modal-foot" style={{ justifyContent: "space-between" }}>
          {confirmDelete ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "var(--red)" }}>
                Permanently delete?
              </span>
              <button
                className="btn btn-ghost"
                onClick={() => setConfirmDelete(false)}
              >
                No
              </button>
              <button
                className="btn"
                style={{ background: "var(--red)", color: "#fff" }}
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
              >
                {deleteMutation.isPending ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          ) : (
            <button
              className="btn btn-ghost"
              style={{ color: "var(--red)" }}
              onClick={() => setConfirmDelete(true)}
            >
              Delete Employee
            </button>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              disabled={updateMutation.isPending}
              onClick={() => {
                setError("");
                updateMutation.mutate(form);
              }}
            >
              {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
