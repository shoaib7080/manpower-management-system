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
import { EMP_STATUSES, TRADES, isMobReady, toDateInput } from "./employeeUtils";

const sectionCls =
  "text-label-sm font-bold uppercase tracking-wide text-outline mt-4 mb-2 first:mt-0";
const gridCls = "grid grid-cols-2 gap-2.5";

export default function EmployeeDetailModal({ emp, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: emp.name || "",
    trade: emp.trade || "",
    specialization: emp.specialization || "",
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

  const { data: specializations = [] } = useQuery({
    queryKey: ["specializations", form.trade],
    queryFn: () => getSpecializations(form.trade).then((r) => r.data),
    enabled: !!form.trade,
  });

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
      <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_4px_12px_rgba(15,23,42,0.08)] w-[520px] max-w-full max-h-[85vh] overflow-y-auto">
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
                {TRADES.map((t) => (
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

          <div className={sectionCls}>Documents</div>
          <div className={gridCls}>
            <Field label="HSE Passport No.">
              <input
                className={inputCls}
                value={form.documents.hsePassport.number}
                onChange={(e) =>
                  set("documents.hsePassport.number", e.target.value)
                }
              />
            </Field>
            <Field label="HSE Passport Expiry">
              <input
                type="date"
                className={inputCls}
                value={form.documents.hsePassport.expiry}
                onChange={(e) =>
                  set("documents.hsePassport.expiry", e.target.value)
                }
              />
            </Field>
            <Field label="CICPA No.">
              <input
                className={inputCls}
                value={form.documents.cicpaPass.number}
                onChange={(e) =>
                  set("documents.cicpaPass.number", e.target.value)
                }
              />
            </Field>
            <Field label="CICPA Expiry">
              <input
                type="date"
                className={inputCls}
                value={form.documents.cicpaPass.expiry}
                onChange={(e) =>
                  set("documents.cicpaPass.expiry", e.target.value)
                }
              />
            </Field>
          </div>

          <div className={sectionCls}>Trainings</div>
          <div className={gridCls}>
            {[
              ["ADNOC Induction Expiry", "trainings.adnocInductionExpiry"],
              ["H2S Expiry", "trainings.h2sExpiry"],
              ["Medical Expiry", "trainings.medicalExpiry"],
              ["Sea Survival Expiry", "trainings.seaSurvivalExpiry"],
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
