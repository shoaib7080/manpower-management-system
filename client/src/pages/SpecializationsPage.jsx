import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, ChevronDown, Edit2, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import {
  createSpecialization,
  deactivateSpecialization,
  getSpecializations,
  updateSpecialization,
} from "../api/services";
import {
  Overlay,
  WarnBox,
  btnOutline,
  btnPrimary,
  iconBtn,
} from "../components/ui/Modal";
import useTrades from "../hooks/useTrades";

const EMPTY = {
  name: "",
  trades: [],
  certifications: [],
};

const SUGGESTED_CERTS = [
  "ASME IX",
  "AWS D1.1",
  "ISO 9606",
  "CSWIP 3.1",
  "BGAS Grade 2",
  "NACE CIP Level 1",
  "API 510",
  "API 570",
  "API 653",
  "LEEA Lifting",
  "OPITO Rigger",
];

const pillCls = (active) =>
  `px-2.5 py-1.5 rounded text-label-sm font-medium border whitespace-nowrap transition-colors ${
    active
      ? "bg-primary-container text-on-primary border-primary-container font-semibold"
      : "bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface-container-low"
  }`;

const th =
  "text-left text-label-sm uppercase text-on-surface-variant bg-surface-container-low px-3.5 py-2.5 border-b border-outline-variant whitespace-nowrap";
const td = "px-3.5 py-2.5 border-b border-outline-variant align-middle";

export default function SpecializationsPage() {
  const qc = useQueryClient();
  const { trades = [] } = useTrades();
  const [tradeFilter, setTradeFilter] = useState("");
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [editingSpec, setEditingSpec] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [tradeSelectVal, setTradeSelectVal] = useState("");
  const [error, setError] = useState("");

  const { data: specs = [], isLoading } = useQuery({
    queryKey: ["specializations", tradeFilter],
    queryFn: () => getSpecializations(tradeFilter).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: createSpecialization,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["specializations"] });
      closeModal();
    },
    onError: (e) =>
      setError(e.response?.data?.message || "Failed to create specialization."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateSpecialization(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["specializations"] });
      closeModal();
    },
    onError: (e) =>
      setError(e.response?.data?.message || "Failed to update specialization."),
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateSpecialization,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["specializations"] }),
  });

  const openCreateModal = () => {
    setModalMode("create");
    setEditingSpec(null);
    setForm({
      name: "",
      trades: trades.length > 0 ? [trades[0]] : [],
      certifications: [],
    });
    setError("");
  };

  const openEditModal = (spec) => {
    setModalMode("edit");
    setEditingSpec(spec);
    const specTrades = Array.isArray(spec.trades)
      ? spec.trades
      : spec.trade
        ? [spec.trade]
        : [];
    const specCerts = Array.isArray(spec.certifications)
      ? spec.certifications.map((c) => (typeof c === "string" ? c : c.name))
      : [];

    setForm({
      name: spec.name || "",
      trades: specTrades,
      certifications: specCerts,
    });
    setError("");
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingSpec(null);
    setForm(EMPTY);
    setError("");
  };

  const handleAddTrade = (tradeToAdd) => {
    if (!tradeToAdd) return;
    if (!form.trades.includes(tradeToAdd)) {
      setForm((prev) => ({
        ...prev,
        trades: [...prev.trades, tradeToAdd],
      }));
    }
    setTradeSelectVal("");
  };

  const handleRemoveTrade = (tradeToRemove) => {
    if (form.trades.length <= 1) {
      setError("At least one associated trade is required.");
      return;
    }
    setError("");
    setForm((prev) => ({
      ...prev,
      trades: prev.trades.filter((t) => t !== tradeToRemove),
    }));
  };

  const handleAddCert = () => {
    setForm((prev) => ({
      ...prev,
      certifications: [...prev.certifications, ""],
    }));
  };

  const handleCertChange = (index, value) => {
    setForm((prev) => {
      const updated = [...prev.certifications];
      updated[index] = value;
      return { ...prev, certifications: updated };
    });
  };

  const handleRemoveCert = (index) => {
    setForm((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Specialization Name is required.");
      return;
    }
    if (!form.trades.length) {
      setError("At least one associated trade must be selected.");
      return;
    }

    // Clean up empty cert strings
    const cleanedCerts = form.certifications
      .map((c) => c.trim())
      .filter(Boolean);

    setError("");

    const payload = {
      name: form.name.trim(),
      trades: form.trades,
      certifications: cleanedCerts,
    };

    if (modalMode === "create") {
      createMutation.mutate(payload);
    } else if (modalMode === "edit" && editingSpec) {
      updateMutation.mutate({
        id: editingSpec._id,
        payload,
      });
    }
  };

  const availableTradesToAdd = trades.filter((t) => !form.trades.includes(t));

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-5 flex-wrap mb-1">
        <div>
          <h1 className="text-headline-sm text-on-background">
            Specializations
          </h1>
          <div className="text-body-sm text-on-surface-variant mt-1">
            Admin-managed lookup list. Used to define trade sub-skills and
            required certifications for workforce validation.
          </div>
        </div>
        <button className={btnPrimary} onClick={openCreateModal}>
          <Plus size={16} /> New Specialization
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3 mt-5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-label-sm uppercase text-on-surface-variant mr-1">
            Trade
          </span>
          <button
            className={pillCls(tradeFilter === "")}
            onClick={() => setTradeFilter("")}
          >
            All
          </button>
          {trades.map((t) => (
            <button
              key={t}
              className={pillCls(tradeFilter === t)}
              onClick={() => setTradeFilter(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden mt-3.5">
        {isLoading ? (
          <div className="text-center text-outline text-body-sm py-8">
            Loading…
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {[
                  "Specialization Name",
                  "Associated Trades",
                  "Required Certifications",
                  "Created",
                  "",
                ].map((h) => (
                  <th key={h} className={th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {specs.map((s) => {
                const specTrades = Array.isArray(s.trades)
                  ? s.trades
                  : s.trade
                    ? [s.trade]
                    : [];
                const specCerts = Array.isArray(s.certifications)
                  ? s.certifications
                  : [];

                return (
                  <tr
                    key={s._id}
                    className="hover:bg-surface-container-low transition-colors"
                  >
                    <td
                      className={`${td} font-semibold text-on-surface text-body-sm`}
                    >
                      {s.name}
                    </td>
                    <td className={td}>
                      <div className="flex flex-wrap gap-1.5">
                        {specTrades.map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant text-label-sm text-on-surface"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className={td}>
                      {specCerts.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {specCerts.map((c, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary-fixed/60 text-on-primary-fixed text-label-sm font-medium border border-primary-fixed-dim"
                            >
                              <Award size={12} className="text-primary" />
                              {typeof c === "string" ? c : c.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-outline text-body-sm">—</span>
                      )}
                    </td>
                    <td
                      className={`${td} text-body-sm text-on-surface-variant whitespace-nowrap`}
                    >
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td className={`${td} text-right`}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          className={`${iconBtn} text-primary hover:bg-primary-fixed/40 flex items-center gap-1`}
                          onClick={() => openEditModal(s)}
                          title="Edit specialization"
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                        <button
                          className={`${iconBtn} text-error border-error hover:bg-error-container/20`}
                          disabled={deactivateMutation.isPending}
                          onClick={() =>
                            window.confirm(`Deactivate "${s.name}"?`) &&
                            deactivateMutation.mutate(s._id)
                          }
                          title="Deactivate specialization"
                        >
                          Deactivate
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!isLoading && specs.length === 0 && (
          <div className="text-center text-outline text-body-sm py-8">
            No active specializations{tradeFilter ? ` for ${tradeFilter}` : ""}.
          </div>
        )}
      </div>

      {/* Stitch Design Modal (Create & Edit) */}
      {modalMode && (
        <Overlay onBackdropClick={closeModal}>
          <div className="bg-surface-container-lowest w-full max-w-[640px] max-h-[90vh] rounded-xl flex flex-col shadow-[0_4px_12px_rgba(15,23,42,0.08)] border border-outline-variant overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-outline-variant relative shrink-0 bg-surface-container-lowest">
              <button
                aria-label="Close modal"
                type="button"
                onClick={closeModal}
                className="absolute top-6 right-6 text-on-surface-variant hover:text-on-surface transition-colors p-1"
              >
                <X size={20} />
              </button>
              <h2 className="text-headline-sm font-semibold text-on-surface mb-1">
                {modalMode === "create"
                  ? "Create New Specialization"
                  : `Edit — ${editingSpec?.name}`}
              </h2>
              <p className="text-body-sm text-on-surface-variant pr-8">
                Define sub-skills and certification requirements for precise
                trade allocation.
              </p>
            </div>

            {/* Scrollable Form Body */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar bg-surface-container-lowest grow">
                {error && <WarnBox>{error}</WarnBox>}

                {/* Section 1: Basic Info */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-label-md uppercase tracking-wide text-on-surface-variant">
                    Basic Information
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-label-md font-medium text-on-surface">
                      Specialization Name <span className="text-error">*</span>
                    </label>
                    <input
                      className="h-10 px-3 border border-outline-variant rounded bg-surface-container-lowest text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow"
                      placeholder="e.g., 6G TIG Welding"
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                    />
                  </div>
                </div>

                {/* Section 2: Associated Trades */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-label-md uppercase tracking-wide text-on-surface-variant">
                    Associated Trades
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-label-md font-medium text-on-surface">
                      Select Trades <span className="text-error">*</span>
                    </label>
                    <div className="min-h-10 p-2 border border-outline-variant rounded bg-surface-container-lowest flex flex-wrap items-center gap-2 relative">
                      {/* Selected Trade Chips */}
                      {form.trades.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1.5 bg-surface-container-high border border-outline-variant rounded px-2.5 py-1 text-label-sm text-on-surface"
                        >
                          {t}
                          <button
                            type="button"
                            onClick={() => handleRemoveTrade(t)}
                            className="hover:text-error flex items-center justify-center transition-colors"
                            title="Remove trade"
                          >
                            <X size={13} />
                          </button>
                        </span>
                      ))}

                      {/* Add Trade Dropdown */}
                      {availableTradesToAdd.length > 0 && (
                        <div className="relative inline-flex items-center ml-auto">
                          <select
                            value={tradeSelectVal}
                            onChange={(e) => handleAddTrade(e.target.value)}
                            className="h-7 text-label-sm bg-surface-container-low border border-outline-variant rounded px-2 pr-6 text-on-surface focus:outline-none focus:border-primary cursor-pointer appearance-none"
                          >
                            <option value="">+ Add Trade...</option>
                            {availableTradesToAdd.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={14}
                            className="absolute right-1.5 text-outline pointer-events-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 3: Required Certifications */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-label-md uppercase tracking-wide text-on-surface-variant">
                      Required Certifications
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddCert}
                      className="text-label-md font-semibold text-primary hover:text-on-primary-fixed-variant flex items-center gap-1 transition-colors"
                    >
                      <Plus size={15} /> Add Cert
                    </button>
                  </div>

                  <datalist id="suggested-certs">
                    {SUGGESTED_CERTS.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>

                  <div className="flex flex-col gap-2">
                    {form.certifications.length === 0 ? (
                      <div className="p-3.5 border border-dashed border-outline-variant rounded-lg text-center text-body-sm text-outline">
                        No certifications added yet. Click &ldquo;+ Add
                        Cert&rdquo; if workers with this specialization must
                        hold specific credentials.
                      </div>
                    ) : (
                      form.certifications.map((cert, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-2.5 border border-outline-variant rounded bg-surface-bright"
                        >
                          <div className="flex-1">
                            <input
                              list="suggested-certs"
                              className="h-9 px-2.5 w-full border border-outline-variant rounded bg-surface-container-lowest text-body-sm text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                              placeholder="e.g., ASME IX, AWS D1.1, ISO 9606..."
                              value={cert}
                              onChange={(e) =>
                                handleCertChange(index, e.target.value)
                              }
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCert(index)}
                            className="h-9 w-9 flex items-center justify-center text-outline hover:text-error hover:bg-error-container/40 rounded transition-colors"
                            title="Remove certification"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-outline-variant bg-surface-bright flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-10 px-4 flex items-center justify-center border border-outline-variant rounded bg-surface-container-lowest text-on-surface font-label-md hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-4 flex items-center justify-center rounded bg-primary-container text-on-primary font-label-md font-semibold hover:bg-primary transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Saving…"
                    : modalMode === "create"
                      ? "Create Specialization"
                      : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </Overlay>
      )}
    </div>
  );
}
