import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createUser, deleteUser, getUsers, updateUser } from "../api/services";

const LEVEL_LABELS = {
  1: "Admin",
  2: "Project Engineer",
  3: "Production Supervisor",
  4: "Field User",
};

const EMPTY = { name: "", email: "", password: "", level: 4 };

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
      <div className="topbar">
        <div>
          <h1>User Management</h1>
          <div className="sub">
            Only Level 1 admins can create or remove users.
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setModalOpen(true);
            setError("");
          }}
        >
          + New User
        </button>
      </div>

      <div className="table-wrap" style={{ marginTop: 20 }}>
        {isLoading ? (
          <div className="empty-state">Loading users…</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Level</th>
                <th>Role</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="emp-name">{u.name}</td>
                  <td className="mono" style={{ fontSize: 12 }}>
                    {u.email}
                  </td>
                  <td>{u.level}</td>
                  <td>{LEVEL_LABELS[u.level] || `Level ${u.level}`}</td>
                  <td style={{ color: "var(--text-2)", fontSize: 12 }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    {u.level > 1 && (
                      <>
                        <button
                          className="icon-btn"
                          style={{ marginRight: 4 }}
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
                          className="icon-btn"
                          style={{
                            color: "var(--red)",
                            borderColor: "var(--red)",
                          }}
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
        <div className="overlay show">
          <div className="modal">
            <div className="modal-head">
              <h3>Create New User</h3>
              <button
                className="modal-close"
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div className="warn-box" style={{ marginBottom: 12 }}>
                    <div className="warn-label">Error</div>
                    <p>{error}</p>
                  </div>
                )}
                <div className="field">
                  <label>
                    Full Name <span className="req">*</span>
                  </label>
                  <input
                    className="ff"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>
                    Email <span className="req">*</span>
                  </label>
                  <input
                    className="ff"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>
                <div className="field">
                  <label>
                    Password <span className="req">*</span>
                  </label>
                  <input
                    className="ff"
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                  />
                </div>
                <div className="field">
                  <label>Level</label>
                  <select
                    className="ff"
                    value={form.level}
                    onChange={(e) =>
                      setForm({ ...form, level: Number(e.target.value) })
                    }
                  >
                    <option value={2}>2 — Project Engineer</option>
                    <option value={3}>3 — Production Supervisor</option>
                    <option value={4}>4 — Field User</option>
                  </select>
                </div>
              </div>
              <div className="modal-foot">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Creating…" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editTarget && (
        <div className="overlay show">
          <div className="modal">
            <div className="modal-head">
              <h3>Edit User</h3>
              <button
                className="modal-close"
                onClick={() => setEditTarget(null)}
              >
                ✕
              </button>
            </div>
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
              <div className="modal-body">
                {error && (
                  <div className="warn-box" style={{ marginBottom: 12 }}>
                    <div className="warn-label">Error</div>
                    <p>{error}</p>
                  </div>
                )}
                <div className="field">
                  <label>
                    Full Name <span className="req">*</span>
                  </label>
                  <input
                    className="ff"
                    required
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                  />
                </div>
                <div className="field">
                  <label>
                    Email <span className="req">*</span>
                  </label>
                  <input
                    className="ff"
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                  />
                </div>
                <div className="field">
                  <label>
                    New Password{" "}
                    <span style={{ color: "var(--text-3)", fontWeight: 400 }}>
                      (leave blank to keep current)
                    </span>
                  </label>
                  <input
                    className="ff"
                    type="password"
                    value={editForm.password}
                    onChange={(e) =>
                      setEditForm({ ...editForm, password: e.target.value })
                    }
                  />
                </div>
                <div className="field">
                  <label>Level</label>
                  <select
                    className="ff"
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
                </div>
              </div>
              <div className="modal-foot">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditTarget(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
