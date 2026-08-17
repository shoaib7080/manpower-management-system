import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Edit2, Plus, Search, Trash2, X } from "lucide-react";
import { useState } from "react";
import {
  createTrade,
  deactivateTrade,
  getTrades,
  updateTrade,
} from "../api/services";
import {
  Field,
  ModalBody,
  Overlay,
  WarnBox,
  btnOutline,
  btnPrimary,
  iconBtn,
  inputCls,
} from "../components/ui/Modal";

const EMPTY_TRADE = { name: "", description: "" };

const th =
  "text-left text-label-sm uppercase text-on-surface-variant bg-surface-container-low px-3.5 py-2.5 border-b border-outline-variant whitespace-nowrap";
const td = "px-3.5 py-2.5 border-b border-outline-variant align-middle";

export default function TradesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [editingTrade, setEditingTrade] = useState(null);
  const [form, setForm] = useState(EMPTY_TRADE);
  const [error, setError] = useState("");

  const { data: trades = [], isLoading } = useQuery({
    queryKey: ["trades"],
    queryFn: () => getTrades().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: createTrade,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trades"] });
      closeModal();
    },
    onError: (e) =>
      setError(e.response?.data?.message || "Failed to create trade."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateTrade(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trades"] });
      closeModal();
    },
    onError: (e) =>
      setError(e.response?.data?.message || "Failed to update trade."),
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateTrade,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trades"] }),
  });

  const openCreateModal = () => {
    setModalMode("create");
    setEditingTrade(null);
    setForm(EMPTY_TRADE);
    setError("");
  };

  const openEditModal = (trade) => {
    setModalMode("edit");
    setEditingTrade(trade);
    setForm({
      name: trade.name || "",
      description: trade.description || "",
    });
    setError("");
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingTrade(null);
    setForm(EMPTY_TRADE);
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Trade name is required.");
      return;
    }
    setError("");

    if (modalMode === "create") {
      createMutation.mutate({
        name: form.name.trim(),
        description: form.description.trim(),
      });
    } else if (modalMode === "edit" && editingTrade) {
      updateMutation.mutate({
        id: editingTrade._id,
        payload: {
          name: form.name.trim(),
          description: form.description.trim(),
        },
      });
    }
  };

  const filteredTrades = trades.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-start justify-between gap-5 flex-wrap mb-1">
        <div>
          <h1 className="text-headline-sm text-on-background">
            Trades Management
          </h1>
          <div className="text-body-sm text-on-surface-variant mt-1">
            Admin-managed trade categories for manpower allocation, employee
            profiles, and job order fulfillment.
          </div>
        </div>
        <button className={btnPrimary} onClick={openCreateModal}>
          <Plus size={16} /> New Trade
        </button>
      </div>

      {/* Search Bar & Summary */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3 mt-5 flex items-center justify-between flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-[380px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-outline"
          />
          <input
            type="text"
            className="w-full h-9 pl-9 pr-3 border border-outline-variant rounded bg-surface-container-lowest text-body-sm text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
            placeholder="Search trades by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="text-label-sm text-on-surface-variant font-medium">
          Total Active Trades:{" "}
          <span className="font-bold text-on-surface">{trades.length}</span>
        </div>
      </div>

      {/* Trades Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden mt-3.5">
        {isLoading ? (
          <div className="text-center text-outline text-body-sm py-8">
            Loading trades…
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Trade Name", "Description", "Created Date", ""].map((h) => (
                  <th key={h} className={th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTrades.map((trade) => (
                <tr
                  key={trade._id}
                  className="hover:bg-surface-container-low transition-colors"
                >
                  <td
                    className={`${td} font-semibold text-on-surface text-body-sm`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-primary-fixed/50 border border-primary-fixed-dim flex items-center justify-center text-primary shrink-0">
                        <Briefcase size={14} />
                      </div>
                      <span>{trade.name}</span>
                    </div>
                  </td>
                  <td
                    className={`${td} text-body-sm text-on-surface-variant max-w-[320px] truncate`}
                  >
                    {trade.description || (
                      <span className="text-outline">—</span>
                    )}
                  </td>
                  <td
                    className={`${td} text-body-sm text-on-surface-variant whitespace-nowrap`}
                  >
                    {new Date(trade.createdAt).toLocaleDateString()}
                  </td>
                  <td className={`${td} text-right`}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        className={`${iconBtn} text-primary hover:bg-primary-fixed/40 flex items-center gap-1`}
                        onClick={() => openEditModal(trade)}
                        title="Edit trade"
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                      <button
                        className={`${iconBtn} text-error border-error hover:bg-error-container/20`}
                        disabled={deactivateMutation.isPending}
                        onClick={() =>
                          window.confirm(`Deactivate trade "${trade.name}"?`) &&
                          deactivateMutation.mutate(trade._id)
                        }
                        title="Deactivate trade"
                      >
                        Deactivate
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!isLoading && filteredTrades.length === 0 && (
          <div className="text-center text-outline text-body-sm py-8">
            {search ? "No trades matching search." : "No active trades found."}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalMode && (
        <Overlay onBackdropClick={closeModal}>
          <div className="bg-surface-container-lowest w-full max-w-[500px] rounded-xl flex flex-col shadow-[0_4px_12px_rgba(15,23,42,0.08)] border border-outline-variant overflow-hidden">
            <div className="p-6 border-b border-outline-variant relative bg-surface-container-lowest">
              <button
                type="button"
                onClick={closeModal}
                className="absolute top-6 right-6 text-on-surface-variant hover:text-on-surface p-1 transition-colors"
              >
                <X size={20} />
              </button>
              <h2 className="text-headline-sm font-semibold text-on-surface">
                {modalMode === "create"
                  ? "Create New Trade"
                  : `Edit — ${editingTrade?.name}`}
              </h2>
              <p className="text-body-sm text-on-surface-variant mt-1">
                {modalMode === "create"
                  ? "Add a new trade designation to the manpower system."
                  : "Update the trade name or description."}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <ModalBody>
                {error && <WarnBox>{error}</WarnBox>}

                <Field label="Trade Name" required>
                  <input
                    type="text"
                    required
                    className={inputCls}
                    placeholder="e.g. Instrumentation Technician"
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </Field>

                <Field label="Description" hint="(Optional)">
                  <textarea
                    rows={3}
                    className={`${inputCls} resize-none`}
                    placeholder="Brief description of trade responsibilities or scope..."
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </Field>
              </ModalBody>

              <div className="p-5 border-t border-outline-variant bg-surface-bright flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={closeModal}
                  className={btnOutline}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={btnPrimary}
                >
                  {isSubmitting
                    ? "Saving…"
                    : modalMode === "create"
                      ? "Create Trade"
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
