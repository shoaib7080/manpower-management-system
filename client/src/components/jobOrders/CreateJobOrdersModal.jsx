import { Briefcase, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { TRADES } from "../manpower/employeeUtils";
import {
  Field,
  ModalBody,
  ModalFoot,
  Overlay,
  WarnBox,
  btnGhost,
  btnPrimary,
  inputCls,
} from "../ui/Modal";

const CLIENT_CATEGORIES = [
  "ADNOC Onshore",
  "ADNOC Offshore",
  "Internal Production",
  "Other",
];

export default function CreateJobOrderModal({
  isOpen,
  onClose,
  onSubmit,
  isPending,
}) {
  const [jobOrderNumber, setJobOrderNumber] = useState("");
  const [siteName, setSiteName] = useState("");
  const [clientCategory, setClientCategory] = useState("ADNOC Offshore");
  const [projectEngineer, setProjectEngineer] = useState("");
  const [startDate, setStartDate] = useState("");
  const [requirements, setRequirements] = useState([
    { trade: "Fabricator", requiredQty: 3 },
    { trade: "Welder", requiredQty: 2 },
  ]);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleAddRequirement = () => {
    setRequirements([...requirements, { trade: "Fitter", requiredQty: 1 }]);
  };

  const handleRemoveRequirement = (index) => {
    if (requirements.length === 1) return;
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const handleReqChange = (index, field, value) => {
    const updated = [...requirements];
    updated[index][field] =
      field === "requiredQty" ? parseInt(value) || 1 : value;
    setRequirements(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !jobOrderNumber.trim() ||
      !siteName.trim() ||
      !projectEngineer.trim() ||
      !startDate
    ) {
      setError("Please fill in all required job order details.");
      return;
    }

    const payload = {
      jobOrderNumber: jobOrderNumber.trim(),
      siteName: siteName.trim(),
      clientCategory,
      projectEngineer: projectEngineer.trim(),
      startDate,
      requirements,
    };

    setError("");
    onSubmit(payload);
  };

  return (
    <Overlay onBackdropClick={onClose}>
      <div className="bg-surface border border-outline-variant rounded-xl w-full max-w-xl shadow-[0_4px_12px_rgba(15,23,42,0.08)] max-h-[90vh] overflow-y-auto">
        <div className="px-[18px] py-3.5 border-b border-outline-variant flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Briefcase size={17} className="text-primary-container" />
            <h3 className="text-body-lg font-semibold text-on-surface">
              Create New Job Order
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <ModalBody>
            {error && <WarnBox>{error}</WarnBox>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Job Order Number" required>
                <input
                  type="text"
                  value={jobOrderNumber}
                  onChange={(e) => setJobOrderNumber(e.target.value)}
                  placeholder="e.g. JO-2026-101"
                  className={inputCls}
                />
              </Field>
              <Field label="Site Name" required>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="e.g. ADNOC Offshore Das Island"
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Client Category">
                <select
                  value={clientCategory}
                  onChange={(e) => setClientCategory(e.target.value)}
                  className={inputCls}
                >
                  {CLIENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Lead Project Engineer" required>
                <input
                  type="text"
                  value={projectEngineer}
                  onChange={(e) => setProjectEngineer(e.target.value)}
                  placeholder="Eng. Ahmed Al-Mansoori"
                  className={inputCls}
                />
              </Field>
              <Field label="Target Start Date" required>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>

            <hr className="border-outline-variant my-3" />

            <div className="flex justify-between items-center mb-2">
              <h4 className="text-label-sm uppercase text-on-surface-variant">
                Team Trade Requirements
              </h4>
              <button
                type="button"
                onClick={handleAddRequirement}
                className="text-label-sm text-primary-container font-semibold flex items-center gap-1 hover:underline"
              >
                <Plus size={14} /> Add Trade
              </button>
            </div>

            <div className="space-y-2">
              {requirements.map((req, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-surface-container-lowest p-2 border border-outline-variant rounded"
                >
                  <select
                    value={req.trade}
                    onChange={(e) =>
                      handleReqChange(index, "trade", e.target.value)
                    }
                    className={`flex-1 ${inputCls}`}
                  >
                    {TRADES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={req.requiredQty}
                    onChange={(e) =>
                      handleReqChange(index, "requiredQty", e.target.value)
                    }
                    className={`w-20 bg-surface ${inputCls}`}
                    placeholder="Qty"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveRequirement(index)}
                    className="text-outline hover:text-error p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </ModalBody>

          <ModalFoot>
            <button type="button" onClick={onClose} className={btnGhost}>
              Cancel
            </button>
            <button type="submit" disabled={isPending} className={btnPrimary}>
              {isPending ? "Generating Slots..." : "Create Job Order"}
            </button>
          </ModalFoot>
        </form>
      </div>
    </Overlay>
  );
}
