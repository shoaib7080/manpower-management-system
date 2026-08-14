import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

const LEVEL_LABELS = {
  1: "Admin",
  2: "Project Engineer",
  3: "Production Supervisor",
  4: "Field User",
};

const EMPTY = { name: "", email: "", password: "", level: 4 };

const th =
  "text-left text-label-sm uppercase text-on-surface-variant bg-surface-container-low px-3.5 py-2.5 border-b border-outline-variant whitespace-nowrap";
const td = "px-3.5 py-2.5 border-b border-outline-variant align-middle";

export default function UsersPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);
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
      setForm(EMPTY);
      setError("");
    },
    onError: (e) =>
      setError(e.response?.data?.message || "Failed to create user."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => qc.invalidateQueries(["users"]),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateUser(id, payload),
    onSuccess: () => {
      qc.invalidateQueries(["users"]);
      setEditTarget(null);
    },
    onError: (e) =>
      setError(e.response?.data?.message || "Failed to update user."),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    createMutation.mutate(form);
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-5 flex-wrap mb-1">
        <div>
          <h1 className="text-headline-sm text-on-background">
            User Management
          </h1>
          <div className="text-body-sm text-on-surface-variant mt-1">
            Only Level 1 admins can create or remove users.
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

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden mt-5">
        {isLoading ? (
          <div className="text-center text-outline text-body-sm py-8">
            Loading users…
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Name", "Email", "Level", "Role", "Created", ""].map((h) => (
                  <th key={h} className={th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-surface-container-low">
                  <td className={`${td} font-semibold text-on-surface text-body-sm`}>
                    {u.name}
                  </td>
                  <td className={`${td} font-mono-data text-[12px]`}>
                    {u.email}
                  </td>
                  <td className={`${td} text-body-sm`}>{u.level}</td>
                  <td className={`${td} text-body-sm`}>
                    {LEVEL_LABELS[u.level] || `Level ${u.level}`}
                  </td>
                  <td className={`${td} text-body-sm text-on-surface-variant`}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className={`${td} whitespace-nowrap`}>
                    {u.level > 1 && (
                      <>
                        <button
                          className={`${iconBtn} mr-1`}
                          onClick={() => {
                            setEditTarget(u);
                            setEditForm({
                              name: u.name,
                              email: u.email,
                              password: "",
                              level: u.level,
                            });
                            setError("");
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className={`${iconBtn} text-error border-error hover:bg-error-container/20`}
                          onClick={() =>
                            window.confirm(`Delete ${u.name}?`) &&
                            deleteMutation.mutate(u._id)
                          }
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <Overlay>
          <ModalShell>
            <ModalHead title="Create New User" onClose={() => setModalOpen(false)} />
            <form onSubmit={handleSubmit}>
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
                <Field label="Level">
                  <select
                    className={inputCls}
                    value={form.level}
                    onChange={(e) =>
                      setForm({ ...form, level: Number(e.target.value) })
                    }
                  >
                    <option value={2}>2 — Project Engineer</option>
                    <option value={3}>3 — Production Supervisor</option>
                    <option value={4}>4 — Field User</option>
                  </select>
                </Field>
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

      {editTarget && (
        <Overlay>
          <ModalShell>
            <ModalHead title="Edit User" onClose={() => setEditTarget(null)} />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const p = {
                  name: editForm.name,
                  email: editForm.email,
                  level: editForm.level,
                };
                if (editForm.password) p.password = editForm.password;
                updateMutation.mutate({ id: editTarget._id, payload: p });
              }}
            >
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
                <Field label="New Password" hint="(leave blank to keep current)">
                  <input
                    className={inputCls}
                    type="password"
                    value={editForm.password}
                    onChange={(e) =>
                      setEditForm({ ...editForm, password: e.target.value })
                    }
                  />
                </Field>
                <Field label="Level">
                  <select
                    className={inputCls}
                    value={editForm.level}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        level: Number(e.target.value),
                      })
                    }
                  >
                    <option value={1}>1 — Admin</option>
                    <option value={2}>2 — Project Engineer</option>
                    <option value={3}>3 — Production Supervisor</option>
                    <option value={4}>4 — Field User</option>
                  </select>
                </Field>
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
