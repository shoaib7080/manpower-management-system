import { Briefcase, ChevronDown, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import useTrades from "../../hooks/useTrades";
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
  const { trades = [] } = useTrades();
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

  const totalSlots = requirements.reduce(
    (sum, r) => sum + (parseInt(r.requiredQty) || 0),
    0,
  );

  const handleAddRequirement = () => {
    const defaultTrade = trades[0] || "Fitter";
    setRequirements((prev) => [
      ...prev,
      { trade: defaultTrade, requiredQty: 1 },
    ]);
  };

  const handleRemoveRequirement = (index) => {
    if (requirements.length === 1) return;
    setRequirements((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReqChange = (index, field, value) => {
    setRequirements((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: field === "requiredQty" ? Math.max(1, parseInt(value) || 1) : value,
      };
      return updated;
    });
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

    if (requirements.length === 0) {
      setError("Please add at least one trade requirement.");
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
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl w-full max-w-xl shadow-[0_6px_20px_rgba(15,23,42,0.12)] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center shrink-0 bg-surface-container-lowest">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-primary-fixed/60 border border-primary-fixed-dim flex items-center justify-center text-primary shrink-0">
              <Briefcase size={17} />
            </div>
            <div>
              <h3 className="text-headline-sm font-semibold text-on-surface">
                Create New Job Order
              </h3>
              <p className="text-body-xs text-on-surface-variant mt-0.5">
                Define operational site requirements and workforce trade quotas.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 transition-colors rounded"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <ModalBody className="p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar grow">
            {error && <WarnBox>{error}</WarnBox>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <Field label="Job Order Number" required>
                <input
                  type="text"
                  required
                  value={jobOrderNumber}
                  onChange={(e) => setJobOrderNumber(e.target.value)}
                  placeholder="e.g. JO-2026-101"
                  className={inputCls}
                />
              </Field>
              <Field label="Site Name" required>
                <input
                  type="text"
                  required
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="e.g. ADNOC Offshore Das Island"
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <Field label="Client Category" required>
                <div className="relative flex items-center">
                  <select
                    value={clientCategory}
                    onChange={(e) => setClientCategory(e.target.value)}
                    className={`${inputCls} appearance-none pr-8 cursor-pointer`}
                  >
                    {CLIENT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={15}
                    className="absolute right-2.5 text-outline pointer-events-none"
                  />
                </div>
              </Field>
              <Field label="Lead Project Engineer" required>
                <input
                  type="text"
                  required
                  value={projectEngineer}
                  onChange={(e) => setProjectEngineer(e.target.value)}
                  placeholder="Eng. Ahmed Al-Mansoori"
                  className={inputCls}
                />
              </Field>
              <Field label="Target Start Date" required>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Trade Breakdown Section */}
            <div className="pt-2 mt-1">
              <div className="flex justify-between items-center border-b border-outline-variant pb-2.5 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Trade Breakdown
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed/60 border border-primary-fixed-dim text-primary text-[11px] font-bold tracking-wide">
                  Total: {totalSlots}
                </span>
              </div>

              {/* Requirement Cards List */}
              <div className="flex flex-col gap-2.5 mb-3">
                {requirements.map((req, index) => (
                  <div
                    key={index}
                    className="p-2.5 border border-outline-variant rounded-lg bg-surface-container-lowest flex items-center gap-3 shadow-xs hover:border-outline transition-colors"
                  >
                    {/* Trade Selector */}
                    <div className="relative flex-1 flex items-center">
                      <select
                        value={req.trade}
                        onChange={(e) =>
                          handleReqChange(index, "trade", e.target.value)
                        }
                        className="w-full h-10 px-3 pr-8 border border-outline-variant rounded bg-surface-container-lowest text-body-md font-medium text-on-surface appearance-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer transition-shadow"
                      >
                        {trades.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={16}
                        className="absolute right-3 text-outline pointer-events-none"
                      />
                    </div>

                    {/* Quantity Input */}
                    <div className="shrink-0 flex items-center">
                      <input
                        type="number"
                        min="1"
                        value={req.requiredQty}
                        onChange={(e) =>
                          handleReqChange(index, "requiredQty", e.target.value)
                        }
                        className="w-20 h-10 px-2 text-center font-bold text-body-md border border-outline-variant rounded bg-surface-container-low text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow"
                        placeholder="Qty"
                      />
                    </div>

                    {/* Remove Action */}
                    <button
                      type="button"
                      onClick={() => handleRemoveRequirement(index)}
                      disabled={requirements.length === 1}
                      className="w-9 h-9 rounded flex items-center justify-center text-outline hover:text-error hover:bg-error-container/20 transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed shrink-0"
                      title="Remove trade"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Trade Button */}
              <button
                type="button"
                onClick={handleAddRequirement}
                className="w-full py-2.5 border border-dashed border-primary/40 rounded-lg text-primary font-semibold text-label-md flex items-center justify-center gap-1.5 hover:bg-primary-fixed/20 hover:border-primary transition-all"
              >
                <Plus size={16} /> Add Required Trade
              </button>
            </div>
          </ModalBody>

          {/* Modal Footer */}
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
