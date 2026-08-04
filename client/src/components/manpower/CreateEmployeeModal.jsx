import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { createEmployee, getSpecializations } from "../../api/services";
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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-300 rounded-md w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-blue-600" />
            <h3 className="font-bold text-slate-900">
              Add New Employee Profile
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Employee ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                placeholder="e.g. EMP-1050"
                className="w-full text-xs border border-slate-300 rounded p-2 outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Ahmed Hassan"
                className="w-full text-xs border border-slate-300 rounded p-2 outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Trade <span className="text-red-500">*</span>
              </label>
              <select
                name="trade"
                value={formData.trade}
                onChange={handleChange}
                className="w-full text-xs border border-slate-300 rounded p-2 outline-none bg-white focus:border-blue-600"
              >
                {TRADES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Specialization
              </label>
              <select
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                className="w-full text-xs border border-slate-300 rounded p-2 outline-none bg-white focus:border-blue-600"
              >
                <option value="">— None —</option>
                {specializations.map((s) => (
                  <option key={s._id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="w-full text-xs border border-slate-300 rounded p-2 outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Emirates ID
              </label>
              <input
                type="text"
                name="emiratesId"
                value={formData.emiratesId}
                onChange={handleChange}
                placeholder="784-1990-1234567-1"
                className="w-full text-xs border border-slate-300 rounded p-2 outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Passport Number
              </label>
              <input
                type="text"
                name="passportNumber"
                value={formData.passportNumber}
                onChange={handleChange}
                placeholder="A12345678"
                className="w-full text-xs border border-slate-300 rounded p-2 outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <hr className="border-slate-200 my-2" />
          <h4 className="text-xs font-bold uppercase text-slate-700">
            ADNOC & Safety Clearance Expiry Dates
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-600 mb-1">
                ADNOC Induction Expiry
              </label>
              <input
                type="date"
                name="adnocInductionExpiry"
                value={formData.adnocInductionExpiry}
                onChange={handleChange}
                className="w-full text-xs border border-slate-300 rounded p-2 outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">
                H2S Training Expiry
              </label>
              <input
                type="date"
                name="h2sExpiry"
                value={formData.h2sExpiry}
                onChange={handleChange}
                className="w-full text-xs border border-slate-300 rounded p-2 outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">
                Medical Clearance Expiry
              </label>
              <input
                type="date"
                name="medicalExpiry"
                value={formData.medicalExpiry}
                onChange={handleChange}
                className="w-full text-xs border border-slate-300 rounded p-2 outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">
                Sea Survival Expiry
              </label>
              <input
                type="date"
                name="seaSurvivalExpiry"
                value={formData.seaSurvivalExpiry}
                onChange={handleChange}
                className="w-full text-xs border border-slate-300 rounded p-2 outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-50"
            >
              {mutation.isPending ? "Saving…" : "Save Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
