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
import CertificationsSection from "./CertificationsSection";
import useTrades from "../../hooks/useTrades";

export default function CreateEmployeeModal({ onClose }) {
  const qc = useQueryClient();
  const { trades = [] } = useTrades();
  const [formData, setFormData] = useState({
    employeeId: "",
    name: "",
    trade: "",
    specialization: "",
    dob: "",
    emiratesId: "",
    passportNumber: "",
    certifications: [],
    hsePassportAvailable: false,
    hsePassportNumber: "",
    hsePassportExpiry: "",
    cicpaPassAvailable: false,
    cicpaPassNumber: "",
    cicpaPassExpiry: "",
    hseInductionExpiry: "",
    h2sExpiry: "",
    medicalExpiry: "",
    tbosietExpiry: "",
  });
  const [error, setError] = useState("");

  const { data: specializations = [] } = useQuery({
    queryKey: ["specializations", formData.trade],
    queryFn: () => getSpecializations(formData.trade).then((r) => r.data),
    enabled: !!formData.trade,
  });

  const selectedSpecializationObj = specializations.find(
    (s) => s.name === formData.specialization,
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

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
      trade: formData.trade || (trades.length > 0 ? trades[0] : ""),
      specialization: formData.specialization || undefined,
      dob: formData.dob || null,
      emiratesId: formData.emiratesId.trim() || undefined,
      passportNumber: formData.passportNumber.trim() || undefined,
      certifications: formData.certifications || [],
      documents: {
        hsePassport: {
          available: Boolean(formData.hsePassportAvailable),
          number: formData.hsePassportAvailable
            ? formData.hsePassportNumber.trim() || null
            : null,
          expiry: formData.hsePassportAvailable
            ? formData.hsePassportExpiry || null
            : null,
        },
        cicpaPass: {
          available: Boolean(formData.cicpaPassAvailable),
          number: formData.cicpaPassAvailable
            ? formData.cicpaPassNumber.trim() || null
            : null,
          expiry: formData.cicpaPassAvailable
            ? formData.cicpaPassExpiry || null
            : null,
        },
      },
      trainings: {
        hseInductionExpiry: formData.hseInductionExpiry || null,
        adnocInductionExpiry: formData.hseInductionExpiry || null,
        h2sExpiry: formData.h2sExpiry || null,
        medicalExpiry: formData.medicalExpiry || null,
        tbosietExpiry: formData.tbosietExpiry || null,
        seaSurvivalExpiry: formData.tbosietExpiry || null,
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
                  value={formData.trade || (trades.length > 0 ? trades[0] : "")}
                  onChange={handleChange}
                  className={inputCls}
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
            <h4 className="text-label-sm uppercase text-on-surface-variant mb-2">
              Documents (Gating Mobilisation)
            </h4>

            <div className="flex flex-col gap-3 mb-3">
              {/* HSE Passport */}
              <div className="p-3 rounded-lg border border-outline-variant bg-surface-container-low/50 flex flex-col gap-2.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="hsePassportAvailable"
                    className="w-4 h-4 rounded accent-primary-container cursor-pointer"
                    checked={formData.hsePassportAvailable}
                    onChange={handleChange}
                  />
                  <span className="text-label-md font-semibold text-on-surface">
                    HSE Passport Available
                  </span>
                  {!formData.hsePassportAvailable && (
                    <span className="text-[11px] text-outline ml-auto">
                      (Check to enter details)
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="HSE Passport Number">
                    <input
                      type="text"
                      name="hsePassportNumber"
                      disabled={!formData.hsePassportAvailable}
                      value={formData.hsePassportNumber}
                      onChange={handleChange}
                      placeholder={formData.hsePassportAvailable ? "e.g. HSE-12345" : "Mark available to enter"}
                      className={`${inputCls} disabled:opacity-40 disabled:cursor-not-allowed`}
                    />
                  </Field>
                  <Field label="HSE Passport Expiry">
                    <input
                      type="date"
                      name="hsePassportExpiry"
                      disabled={!formData.hsePassportAvailable}
                      value={formData.hsePassportExpiry}
                      onChange={handleChange}
                      className={`${inputCls} disabled:opacity-40 disabled:cursor-not-allowed`}
                    />
                  </Field>
                </div>
              </div>

              {/* CICPA Pass */}
              <div className="p-3 rounded-lg border border-outline-variant bg-surface-container-low/50 flex flex-col gap-2.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="cicpaPassAvailable"
                    className="w-4 h-4 rounded accent-primary-container cursor-pointer"
                    checked={formData.cicpaPassAvailable}
                    onChange={handleChange}
                  />
                  <span className="text-label-md font-semibold text-on-surface">
                    CICPA Pass Available
                  </span>
                  {!formData.cicpaPassAvailable && (
                    <span className="text-[11px] text-outline ml-auto">
                      (Check to enter details)
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="CICPA Pass Number">
                    <input
                      type="text"
                      name="cicpaPassNumber"
                      disabled={!formData.cicpaPassAvailable}
                      value={formData.cicpaPassNumber}
                      onChange={handleChange}
                      placeholder={formData.cicpaPassAvailable ? "e.g. CICPA-98765" : "Mark available to enter"}
                      className={`${inputCls} disabled:opacity-40 disabled:cursor-not-allowed`}
                    />
                  </Field>
                  <Field label="CICPA Pass Expiry">
                    <input
                      type="date"
                      name="cicpaPassExpiry"
                      disabled={!formData.cicpaPassAvailable}
                      value={formData.cicpaPassExpiry}
                      onChange={handleChange}
                      className={`${inputCls} disabled:opacity-40 disabled:cursor-not-allowed`}
                    />
                  </Field>
                </div>
              </div>
            </div>

            <hr className="border-outline-variant my-3" />
            <h4 className="text-label-sm uppercase text-on-surface-variant mb-3">
              HSE &amp; Safety Clearance Expiry Dates
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="HSE Induction Expiry">
                <input
                  type="date"
                  name="hseInductionExpiry"
                  value={formData.hseInductionExpiry}
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
              <Field label="TBOSIET Expiry">
                <input
                  type="date"
                  name="tbosietExpiry"
                  value={formData.tbosietExpiry}
                  onChange={handleChange}
                  className={inputCls}
                />
              </Field>
            </div>

            <CertificationsSection
              certifications={formData.certifications || []}
              onChange={(certs) =>
                setFormData((prev) => ({ ...prev, certifications: certs }))
              }
              selectedSpecializationObj={selectedSpecializationObj}
            />
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
