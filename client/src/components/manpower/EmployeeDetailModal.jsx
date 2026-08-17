import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  deleteEmployee as deleteEmployeeApi,
  getSpecializations,
  updateEmployee as updateEmployeeApi,
} from "../../api/services";
import {
  Field,
  ModalBody,
  ModalHead,
  Overlay,
  btnGhost,
  btnPrimary,
  inputCls,
} from "../ui/Modal";
import CertificationsSection from "./CertificationsSection";
import useTrades from "../../hooks/useTrades";
import { EMP_STATUSES, isMobReady, toDateInput } from "./employeeUtils";

const sectionCls =
  "text-label-sm font-bold uppercase tracking-wide text-outline mt-4 mb-2 first:mt-0";
const gridCls = "grid grid-cols-2 gap-2.5";

export default function EmployeeDetailModal({ emp, onClose }) {
  const qc = useQueryClient();
  const { trades = [] } = useTrades();
  const [form, setForm] = useState({
    name: emp.name || "",
    trade: emp.trade || "",
    specialization: emp.specialization || "",
    status: emp.status || "AVAILABLE",
    dob: toDateInput(emp.dob),
    emiratesId: emp.emiratesId || "",
    passportNumber: emp.passportNumber || "",
    certifications: emp.certifications || [],
    trainings: {
      hseInductionExpiry: toDateInput(
        emp.trainings?.hseInductionExpiry ||
          emp.trainings?.adnocInductionExpiry,
      ),
      h2sExpiry: toDateInput(emp.trainings?.h2sExpiry),
      medicalExpiry: toDateInput(emp.trainings?.medicalExpiry),
      tbosietExpiry: toDateInput(
        emp.trainings?.tbosietExpiry ||
          emp.trainings?.seaSurvivalExpiry,
      ),
    },
    documents: {
      hsePassport: {
        available: Boolean(emp.documents?.hsePassport?.available),
        number: emp.documents?.hsePassport?.number || "",
        expiry: toDateInput(emp.documents?.hsePassport?.expiry),
      },
      cicpaPass: {
        available: Boolean(emp.documents?.cicpaPass?.available),
        number: emp.documents?.cicpaPass?.number || "",
        expiry: toDateInput(emp.documents?.cicpaPass?.expiry),
      },
    },
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  const { data: specializations = [] } = useQuery({
    queryKey: ["specializations", form.trade],
    queryFn: () => getSpecializations(form.trade).then((r) => r.data),
    enabled: !!form.trade,
  });

  const selectedSpecializationObj = specializations.find(
    (s) => s.name === form.specialization,
  );

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
    <Overlay onBackdropClick={onClose}>
      <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_4px_12px_rgba(15,23,42,0.08)] w-[620px] max-w-full max-h-[88vh] overflow-y-auto">
        {!isMobReady(emp) && (
          <div className="text-body-sm bg-error-container/40 text-on-error-container m-3 p-2.5 rounded">
            Not assignable — missing valid HSE Passport or CICPA Pass. Update
            the document fields below and save.
          </div>
        )}
        <ModalHead title={`Edit — ${emp.name}`} onClose={onClose} />
        <ModalBody>
          {error && (
            <div className="text-error text-body-sm mb-2.5">{error}</div>
          )}

          <div className={sectionCls}>Identity</div>
          <div className={gridCls}>
            <Field label="Employee ID (read-only)">
              <input
                className={`${inputCls} opacity-50`}
                value={emp.employeeId}
                disabled
              />
            </Field>
            <Field label="Full Name" required>
              <input
                className={inputCls}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </Field>
            <Field label="Trade" required>
              <select
                className={inputCls}
                value={form.trade}
                onChange={(e) => {
                  set("trade", e.target.value);
                  set("specialization", "");
                }}
              >
                {trades.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Specialization">
              <select
                className={inputCls}
                value={form.specialization}
                onChange={(e) => set("specialization", e.target.value)}
              >
                <option value="">— None —</option>
                {specializations.map((s) => (
                  <option key={s._id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                className={inputCls}
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                {EMP_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Date of Birth">
              <input
                type="date"
                className={inputCls}
                value={form.dob}
                onChange={(e) => set("dob", e.target.value)}
              />
            </Field>
            <Field label="Emirates ID">
              <input
                className={inputCls}
                value={form.emiratesId}
                onChange={(e) => set("emiratesId", e.target.value)}
              />
            </Field>
            <Field label="Passport Number">
              <input
                className={inputCls}
                value={form.passportNumber}
                onChange={(e) => set("passportNumber", e.target.value)}
              />
            </Field>
          </div>

          <div className={sectionCls}>Documents (Gating Mobilisation)</div>
          <div className="flex flex-col gap-3">
            {/* HSE Passport Block */}
            <div className="p-3 rounded-lg border border-outline-variant bg-surface-container-low/50 flex flex-col gap-2.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-primary-container cursor-pointer"
                  checked={form.documents.hsePassport.available}
                  onChange={(e) => {
                    const isAvail = e.target.checked;
                    set("documents.hsePassport.available", isAvail);
                  }}
                />
                <span className="text-label-md font-semibold text-on-surface">
                  HSE Passport Available
                </span>
                {!form.documents.hsePassport.available && (
                  <span className="text-[11px] text-outline ml-auto">
                    (Enable to enter document details)
                  </span>
                )}
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                <Field label="HSE Passport No.">
                  <input
                    disabled={!form.documents.hsePassport.available}
                    className={`${inputCls} disabled:opacity-40 disabled:cursor-not-allowed`}
                    placeholder={form.documents.hsePassport.available ? "e.g. HSE-12345" : "Mark available to enter"}
                    value={form.documents.hsePassport.number}
                    onChange={(e) =>
                      set("documents.hsePassport.number", e.target.value)
                    }
                  />
                </Field>
                <Field label="HSE Passport Expiry">
                  <input
                    type="date"
                    disabled={!form.documents.hsePassport.available}
                    className={`${inputCls} disabled:opacity-40 disabled:cursor-not-allowed`}
                    value={form.documents.hsePassport.expiry}
                    onChange={(e) =>
                      set("documents.hsePassport.expiry", e.target.value)
                    }
                  />
                </Field>
              </div>
            </div>

            {/* CICPA Pass Block */}
            <div className="p-3 rounded-lg border border-outline-variant bg-surface-container-low/50 flex flex-col gap-2.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-primary-container cursor-pointer"
                  checked={form.documents.cicpaPass.available}
                  onChange={(e) => {
                    const isAvail = e.target.checked;
                    set("documents.cicpaPass.available", isAvail);
                  }}
                />
                <span className="text-label-md font-semibold text-on-surface">
                  CICPA Pass Available
                </span>
                {!form.documents.cicpaPass.available && (
                  <span className="text-[11px] text-outline ml-auto">
                    (Enable to enter document details)
                  </span>
                )}
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                <Field label="CICPA No.">
                  <input
                    disabled={!form.documents.cicpaPass.available}
                    className={`${inputCls} disabled:opacity-40 disabled:cursor-not-allowed`}
                    placeholder={form.documents.cicpaPass.available ? "e.g. CICPA-98765" : "Mark available to enter"}
                    value={form.documents.cicpaPass.number}
                    onChange={(e) =>
                      set("documents.cicpaPass.number", e.target.value)
                    }
                  />
                </Field>
                <Field label="CICPA Expiry">
                  <input
                    type="date"
                    disabled={!form.documents.cicpaPass.available}
                    className={`${inputCls} disabled:opacity-40 disabled:cursor-not-allowed`}
                    value={form.documents.cicpaPass.expiry}
                    onChange={(e) =>
                      set("documents.cicpaPass.expiry", e.target.value)
                    }
                  />
                </Field>
              </div>
            </div>
          </div>

          <div className={sectionCls}>Trainings & Clearances</div>
          <div className={gridCls}>
            {[
              ["HSE Induction Expiry", "trainings.hseInductionExpiry"],
              ["H2S Expiry", "trainings.h2sExpiry"],
              ["Medical Expiry", "trainings.medicalExpiry"],
              ["TBOSIET Expiry", "trainings.tbosietExpiry"],
            ].map(([label, path]) => (
              <Field label={label} key={path}>
                <input
                  type="date"
                  className={inputCls}
                  value={path.split(".").reduce((o, k) => o?.[k], form) || ""}
                  onChange={(e) => set(path, e.target.value)}
                />
              </Field>
            ))}
          </div>

          <CertificationsSection
            certifications={form.certifications || []}
            onChange={(certs) =>
              setForm((prev) => ({ ...prev, certifications: certs }))
            }
            selectedSpecializationObj={selectedSpecializationObj}
          />
        </ModalBody>

        <div className="px-[18px] py-3 border-t border-outline-variant flex justify-between items-center bg-surface-container-low">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-body-sm text-error">
                Permanently delete?
              </span>
              <button
                className={btnGhost}
                onClick={() => setConfirmDelete(false)}
              >
                No
              </button>
              <button
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded text-label-md bg-error text-white hover:bg-error/90 disabled:opacity-50"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
              >
                {deleteMutation.isPending ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          ) : (
            <button
              className={`${btnGhost} text-error hover:text-error`}
              onClick={() => setConfirmDelete(true)}
            >
              Delete Employee
            </button>
          )}
          <div className="flex gap-2">
            <button className={btnGhost} onClick={onClose}>
              Cancel
            </button>
            <button
              className={btnPrimary}
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
    </Overlay>
  );
}
