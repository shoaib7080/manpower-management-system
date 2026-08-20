import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, ShieldOff, UserCheck, UserX } from "lucide-react";
import { useState } from "react";
import { createUser, deleteUser, getUsers, updateUser } from "../api/services";
import {
  Field,
  ModalBody,
  ModalFoot,
  ModalHead,
  ModalShell,
  Overlay,
  WarnBox,
  btnOutline,
  btnPrimary,
  iconBtn,
  inputCls,
} from "../components/ui/Modal";
import { useAuth } from "../context/AuthContext";

// ─── Constants ────────────────────────────────────────────────────────────────

const LEVEL_OPTIONS = [
  { value: 0, label: "0 — No Access" },
  { value: 1, label: "1 — Viewer" },
  { value: 2, label: "2 — Operator" },
  { value: 3, label: "3 — Admin" },
];

const LEVEL_BADGE = {
  0: "bg-surface-container text-outline",
  1: "bg-blue-500/10 text-blue-600",
  2: "bg-amber-500/10 text-amber-600",
  3: "bg-primary-container/15 text-primary-container",
};

const LEVEL_LABEL = { 0: "None", 1: "Viewer", 2: "Operator", 3: "Admin" };

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  permissions: { operations: 1, finance: 0, superAdmin: false },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const th =
  "text-left text-label-sm uppercase text-on-surface-variant bg-surface-container-low px-3.5 py-2.5 border-b border-outline-variant whitespace-nowrap";
const td = "px-3.5 py-2.5 border-b border-outline-variant align-middle";

function LevelBadge({ level }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${LEVEL_BADGE[level] ?? LEVEL_BADGE[0]}`}
    >
      {LEVEL_LABEL[level] ?? "–"}
    </span>
  );
}

// ─── Permission form fields (reused in Create & Edit) ────────────────────────

function PermissionFields({
  perms,
  onChange,
  isSelf,
  currentUserIsSuperAdmin,
}) {
  const set = (key, val) => onChange({ ...perms, [key]: val });

  return (
    <>
      <Field label="Operations Access">
        <select
          className={inputCls}
          value={perms.operations}
          onChange={(e) => set("operations", Number(e.target.value))}
        >
          {LEVEL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Finance Access">
        <select
          className={inputCls}
          value={perms.finance}
          onChange={(e) => set("finance", Number(e.target.value))}
        >
          {LEVEL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
      {/* Only a superAdmin can grant/revoke superAdmin status */}
      {currentUserIsSuperAdmin && (
        <Field label="SuperAdmin Access">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={perms.superAdmin}
              disabled={isSelf}
              onChange={(e) => set("superAdmin", e.target.checked)}
              className="w-4 h-4 accent-primary-container"
            />
            <span className="text-body-sm text-on-surface-variant">
              Grant super-administrator privileges
              {isSelf && " (cannot change your own status)"}
            </span>
          </label>
        </Field>
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.permissions?.superAdmin === true;

  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({});

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await getUsers()).data,
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      qc.invalidateQueries(["users"]);
      setModalOpen(false);
      setForm(EMPTY_FORM);
      setError("");
    },
    onError: (e) =>
      setError(e.response?.data?.message || "Failed to create user."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateUser(id, payload),
    onSuccess: () => {
      qc.invalidateQueries(["users"]);
      setEditTarget(null);
      setError("");
    },
    onError: (e) =>
      setError(e.response?.data?.message || "Failed to update user."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => qc.invalidateQueries(["users"]),
    onError: (e) =>
      alert(e.response?.data?.message || "Failed to delete user."),
  });

  // Suspend / Reinstate toggle
  const toggleActive = (u) => {
    updateMutation.mutate({
      id: u._id,
      payload: { isActive: !u.isActive },
    });
  };

  const openEdit = (u) => {
    setEditTarget(u);
    setEditForm({
      name: u.name,
      email: u.email,
      password: "",
      permissions: {
        operations: u.permissions?.operations ?? 1,
        finance: u.permissions?.finance ?? 0,
        superAdmin: u.permissions?.superAdmin ?? false,
      },
      isActive: u.isActive,
    });
    setError("");
  };

  const handleCreate = (e) => {
    e.preventDefault();
    setError("");
    createMutation.mutate(form);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    setError("");
    const payload = {
      name: editForm.name,
      email: editForm.email,
      permissions: editForm.permissions,
      isActive: editForm.isActive,
    };
    if (editForm.password) payload.password = editForm.password;
    updateMutation.mutate({ id: editTarget._id, payload });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-5 flex-wrap mb-1">
        <div>
          <h1 className="text-headline-sm text-on-background">
            User Management
          </h1>
          <div className="text-body-sm text-on-surface-variant mt-1">
            Manage user accounts and per-module access permissions. SuperAdmin
            only.
          </div>
        </div>
        <button
          className={btnPrimary}
          onClick={() => {
            setModalOpen(true);
            setError("");
          }}
        >
          + New User
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden mt-5">
        {isLoading ? (
          <div className="text-center text-outline text-body-sm py-8">
            Loading users…
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {[
                  "Name",
                  "Email",
                  "Operations",
                  "Finance",
                  "SuperAdmin",
                  "Status",
                  "Created",
                  "Actions",
                ].map((h) => (
                  <th key={h} className={th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u._id === currentUser?._id;
                return (
                  <tr
                    key={u._id}
                    className={`hover:bg-surface-container-low ${!u.isActive ? "opacity-50" : ""}`}
                  >
                    <td
                      className={`${td} font-semibold text-on-surface text-body-sm`}
                    >
                      <div className="flex items-center gap-1.5">
                        {u.name}
                        {isSelf && (
                          <span className="text-[10px] bg-primary-container/10 text-primary-container px-1.5 py-0.5 rounded font-semibold">
                            you
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`${td} font-mono text-[12px]`}>{u.email}</td>
                    <td className={td}>
                      <LevelBadge level={u.permissions?.operations ?? 0} />
                    </td>
                    <td className={td}>
                      <LevelBadge level={u.permissions?.finance ?? 0} />
                    </td>
                    <td className={td}>
                      {u.permissions?.superAdmin ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-container">
                          <ShieldCheck size={13} /> Yes
                        </span>
                      ) : (
                        <span className="text-[11px] text-outline">—</span>
                      )}
                    </td>
                    <td className={td}>
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-600">
                          <UserCheck size={13} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-error">
                          <UserX size={13} /> Suspended
                        </span>
                      )}
                    </td>
                    <td
                      className={`${td} text-body-sm text-on-surface-variant`}
                    >
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className={`${td} whitespace-nowrap`}>
                      {!isSelf && (
                        <div className="flex items-center gap-1">
                          <button
                            className={`${iconBtn} mr-0.5`}
                            onClick={() => openEdit(u)}
                            title="Edit user"
                          >
                            Edit
                          </button>
                          <button
                            className={`${iconBtn} ${u.isActive ? "text-amber-600 border-amber-300 hover:bg-amber-50" : "text-green-600 border-green-300 hover:bg-green-50"}`}
                            onClick={() => toggleActive(u)}
                            title={
                              u.isActive
                                ? "Suspend account"
                                : "Reinstate account"
                            }
                          >
                            {u.isActive ? (
                              <>
                                <ShieldOff size={12} /> Suspend
                              </>
                            ) : (
                              <>
                                <ShieldCheck size={12} /> Reinstate
                              </>
                            )}
                          </button>
                          <button
                            className={`${iconBtn} text-error border-error hover:bg-error-container/20`}
                            onClick={() =>
                              window.confirm(
                                `Permanently delete ${u.name}? This cannot be undone.`,
                              ) && deleteMutation.mutate(u._id)
                            }
                            title="Delete user"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Create User Modal ───────────────────────────────────────────────── */}
      {modalOpen && (
        <Overlay>
          <ModalShell>
            <ModalHead
              title="Create New User"
              onClose={() => setModalOpen(false)}
            />
            <form onSubmit={handleCreate}>
              <ModalBody>
                {error && <WarnBox>{error}</WarnBox>}
                <Field label="Full Name" required>
                  <input
                    className={inputCls}
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </Field>
                <Field label="Email" required>
                  <input
                    className={inputCls}
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </Field>
                <Field label="Password" required>
                  <input
                    className={inputCls}
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                  />
                </Field>
                <PermissionFields
                  perms={form.permissions}
                  onChange={(p) => setForm({ ...form, permissions: p })}
                  isSelf={false}
                  currentUserIsSuperAdmin={isSuperAdmin}
                />
              </ModalBody>
              <ModalFoot>
                <button
                  type="button"
                  className={btnOutline}
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={btnPrimary}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Creating…" : "Create User"}
                </button>
              </ModalFoot>
            </form>
          </ModalShell>
        </Overlay>
      )}

      {/* ── Edit User Modal ─────────────────────────────────────────────────── */}
      {editTarget && (
        <Overlay>
          <ModalShell>
            <ModalHead
              title={`Edit: ${editTarget.name}`}
              onClose={() => setEditTarget(null)}
            />
            <form onSubmit={handleUpdate}>
              <ModalBody>
                {error && <WarnBox>{error}</WarnBox>}
                <Field label="Full Name" required>
                  <input
                    className={inputCls}
                    required
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                  />
                </Field>
                <Field label="Email" required>
                  <input
                    className={inputCls}
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                  />
                </Field>
                <Field
                  label="New Password"
                  hint="(leave blank to keep current)"
                >
                  <input
                    className={inputCls}
                    type="password"
                    value={editForm.password}
                    onChange={(e) =>
                      setEditForm({ ...editForm, password: e.target.value })
                    }
                  />
                </Field>
                <PermissionFields
                  perms={editForm.permissions}
                  onChange={(p) => setEditForm({ ...editForm, permissions: p })}
                  isSelf={editTarget._id === currentUser?._id}
                  currentUserIsSuperAdmin={isSuperAdmin}
                />
              </ModalBody>
              <ModalFoot>
                <button
                  type="button"
                  className={btnOutline}
                  onClick={() => setEditTarget(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={btnPrimary}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Saving…" : "Save Changes"}
                </button>
              </ModalFoot>
            </form>
          </ModalShell>
        </Overlay>
      )}
    </div>
  );
}
