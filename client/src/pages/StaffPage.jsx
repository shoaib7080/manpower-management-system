import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, Plus, X } from "lucide-react";
import { useState } from "react";
import {
  createStaff,
  deactivateStaff,
  getStaff,
  updateStaff,
} from "../api/services";
import {
  Overlay,
  WarnBox,
  btnOutline,
  btnPrimary,
  iconBtn,
} from "../components/ui/Modal";

const EMPTY = { name: "", designation: "" };

const th =
  "text-left text-label-sm uppercase text-on-surface-variant bg-surface-container-low px-3.5 py-2.5 border-b border-outline-variant whitespace-nowrap";
const td = "px-3.5 py-2.5 border-b border-outline-variant align-middle";

export default function StaffPage() {
  const qc = useQueryClient();
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [editingStaff, setEditingStaff] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: () => getStaff().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: createStaff,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      closeModal();
    },
    onError: (e) =>
      setError(e.response?.data?.message || "Failed to create staff member."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateStaff(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      closeModal();
    },
    onError: (e) =>
      setError(e.response?.data?.message || "Failed to update staff member."),
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateStaff,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });

  const openCreateModal = () => {
    setModalMode("create");
    setEditingStaff(null);
    setForm(EMPTY);
    setError("");
  };

  const openEditModal = (staff) => {
    setModalMode("edit");
    setEditingStaff(staff);
    setForm({ name: staff.name || "", designation: staff.designation || "" });
    setError("");
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingStaff(null);
    setForm(EMPTY);
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Staff name is required.");
      return;
    }
    if (!form.designation.trim()) {
      setError("Designation is required.");
      return;
    }

    setError("");
    const payload = {
      name: form.name.trim(),
      designation: form.designation.trim(),
    };

    if (modalMode === "create") {
      createMutation.mutate(payload);
    } else if (modalMode === "edit" && editingStaff) {
      updateMutation.mutate({ id: editingStaff._id, payload });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-5 flex-wrap mb-1">
        <div>
          <h1 className="text-headline-sm text-on-background">
            Staff / Authorized Personnel
          </h1>
          <div className="text-body-sm text-on-surface-variant mt-1">
            Manage the list of staff members who can authorize manpower status
            changes. These names appear in the "Authorized By" dropdown during
            audits.
          </div>
        </div>
        <button className={btnPrimary} onClick={openCreateModal}>
          <Plus size={16} /> Add Staff
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden mt-5">
        {isLoading ? (
          <div className="text-center text-outline text-body-sm py-8">
            Loading…
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Name", "Designation", "Created", ""].map((h) => (
                  <th key={h} className={th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staffList.map((s) => (
                <tr
                  key={s._id}
                  className="hover:bg-surface-container-low transition-colors"
                >
                  <td
                    className={`${td} font-semibold text-on-surface text-body-sm`}
                  >
                    {s.name}
                  </td>
                  <td className={`${td} text-body-sm text-on-surface-variant`}>
                    {s.designation}
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
                        title="Edit staff member"
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
                        title="Deactivate staff member"
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
        {!isLoading && staffList.length === 0 && (
          <div className="text-center text-outline text-body-sm py-8">
            No active staff members. Add one to populate the "Authorized By"
            dropdown.
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalMode && (
        <Overlay onBackdropClick={closeModal}>
          <div className="bg-surface-container-lowest w-full max-w-[480px] max-h-[90vh] rounded-xl flex flex-col shadow-[0_4px_12px_rgba(15,23,42,0.08)] border border-outline-variant overflow-hidden">
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
                  ? "Add Staff Member"
                  : `Edit — ${editingStaff?.name}`}
              </h2>
              <p className="text-body-sm text-on-surface-variant pr-8">
                Staff members appear as options in the "Authorized By" dropdown
                for all status changes.
              </p>
            </div>

            {/* Form Body */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="p-6 flex flex-col gap-5 overflow-y-auto custom-scrollbar bg-surface-container-lowest grow">
                {error && <WarnBox>{error}</WarnBox>}

                <div className="flex flex-col gap-1.5">
                  <label className="text-label-md font-medium text-on-surface">
                    Full Name <span className="text-error">*</span>
                  </label>
                  <input
                    className="h-10 px-3 border border-outline-variant rounded bg-surface-container-lowest text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow"
                    placeholder="e.g., Ali Hassan"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-label-md font-medium text-on-surface">
                    Designation <span className="text-error">*</span>
                  </label>
                  <input
                    className="h-10 px-3 border border-outline-variant rounded bg-surface-container-lowest text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow"
                    placeholder="e.g., Site Engineer, Operations Manager"
                    type="text"
                    required
                    value={form.designation}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        designation: e.target.value,
                      }))
                    }
                  />
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
                      ? "Add Staff"
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
