import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { createEmployee, getSpecializations } from "../../api/services";
import {
  Field,
  ModalBody,
  ModalFoot,
  ModalShell,
  Overlay,
  WarnBox,
  btnGhost,
  btnPrimary,
  inputCls,
} from "../ui/Modal";
import { TRADES } from "./employeeUtils";

export default function CreateEmployeeModal({ onClose }) {
  const qc = useQueryClient();
  const [formData, setFormData] = useState({
    employeeId: "",
    name: "",
    trade: "Fabricator",
    specialization: "",
    dob: "",
    emiratesId: "",
    passportNumber: "",
    adnocInductionExpiry: "",
    h2sExpiry: "",
    medicalExpiry: "",
    seaSurvivalExpiry: "",
  });
  const [error, setError] = useState("");

  const { data: specializations = [] } = useQuery({
    queryKey: ["specializations", formData.trade],
    queryFn: () => getSpecializations(formData.trade).then((r) => r.data),
    enabled: !!formData.trade,
  });

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.employeeId.trim() || !formData.name.trim()) {
      setError("Employee ID and Full Name are required.");
      return;
    }
    setError("");
    mutation.mutate({
      employeeId: formData.employeeId.trim(),
      name: formData.name.trim(),
      trade: formData.trade,
      specialization: formData.specialization || undefined,
      dob: formData.dob || null,
      emiratesId: formData.emiratesId.trim() || undefined,
      passportNumber: formData.passportNumber.trim() || undefined,
      trainings: {
        adnocInductionExpiry: formData.adnocInductionExpiry || null,
        h2sExpiry: formData.h2sExpiry || null,
        medicalExpiry: formData.medicalExpiry || null,
        seaSurvivalExpiry: formData.seaSurvivalExpiry || null,
      },
    });
  };

  const mutation = useMutation({
    mutationFn: (payload) => createEmployee(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      onClose();
    },
    onError: (err) => {
      const msg =
        err.response?.data?.message ?? err.response?.data ?? err.message;
      setError(typeof msg === "string" ? msg : "Failed to create employee.");
    },
  });

  return (
    <Overlay>
      <ModalShell width={680}>
        <div className="px-[18px] py-3.5 border-b border-outline-variant flex justify-between items-center">
          <div className="flex items-center gap-2">
            <UserPlus size={17} className="text-primary-container" />
            <h3 className="text-body-lg font-semibold text-on-surface">
              Add New Employee Profile
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface text-base leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[75vh] overflow-y-auto">
          <ModalBody>
            {error && <WarnBox>{error}</WarnBox>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Employee ID" required>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  placeholder="e.g. EMP-1050"
                  className={inputCls}
                />
              </Field>
              <Field label="Full Name" required>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Ahmed Hassan"
                  className={inputCls}
                />
              </Field>
              <Field label="Trade" required>
                <select
                  name="trade"
                  value={formData.trade}
                  onChange={handleChange}
                  className={inputCls}
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
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  className={inputCls}
                >
                  <option value="">— None —</option>
                  {specializations.map((s) => (
                    <option key={s._id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Date of Birth">
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className={inputCls}
                />
              </Field>
              <Field label="Emirates ID">
                <input
                  type="text"
                  name="emiratesId"
                  value={formData.emiratesId}
                  onChange={handleChange}
                  placeholder="784-1990-1234567-1"
                  className={inputCls}
                />
              </Field>
              <Field label="Passport Number">
                <input
                  type="text"
                  name="passportNumber"
                  value={formData.passportNumber}
                  onChange={handleChange}
                  placeholder="A12345678"
                  className={inputCls}
                />
              </Field>
            </div>

            <hr className="border-outline-variant my-3" />
            <h4 className="text-label-sm uppercase text-on-surface-variant mb-3">
              ADNOC &amp; Safety Clearance Expiry Dates
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="ADNOC Induction Expiry">
                <input
                  type="date"
                  name="adnocInductionExpiry"
                  value={formData.adnocInductionExpiry}
                  onChange={handleChange}
                  className={inputCls}
                />
              </Field>
              <Field label="H2S Training Expiry">
                <input
                  type="date"
                  name="h2sExpiry"
                  value={formData.h2sExpiry}
                  onChange={handleChange}
                  className={inputCls}
                />
              </Field>
              <Field label="Medical Clearance Expiry">
                <input
                  type="date"
                  name="medicalExpiry"
                  value={formData.medicalExpiry}
                  onChange={handleChange}
                  className={inputCls}
                />
              </Field>
              <Field label="Sea Survival Expiry">
                <input
                  type="date"
                  name="seaSurvivalExpiry"
                  value={formData.seaSurvivalExpiry}
                  onChange={handleChange}
                  className={inputCls}
                />
              </Field>
            </div>
          </ModalBody>

          <ModalFoot>
            <button type="button" onClick={onClose} className={btnGhost}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className={btnPrimary}
            >
              {mutation.isPending ? "Saving…" : "Save Employee"}
            </button>
          </ModalFoot>
        </form>
      </ModalShell>
    </Overlay>
  );
}
