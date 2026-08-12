import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  createSpecialization,
  deactivateSpecialization,
  getSpecializations,
} from "../api/services";
import { TRADES } from "../components/manpower/employeeUtils";

const EMPTY = { name: "", trade: TRADES[0] };

export default function SpecializationsPage() {
  const qc = useQueryClient();
  const [tradeFilter, setTradeFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  const { data: specs = [], isLoading } = useQuery({
    queryKey: ["specializations", tradeFilter],
    queryFn: () => getSpecializations(tradeFilter).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: createSpecialization,
    onSuccess: () => {
      qc.invalidateQueries(["specializations"]);
      setModalOpen(false);
      setForm(EMPTY);
      setError("");
    },
    onError: (e) => setError(e.response?.data?.message || "Failed to create."),
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateSpecialization,
    onSuccess: () => qc.invalidateQueries(["specializations"]),
  });

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Specializations</h1>
          <div className="sub">
            Admin-managed lookup list. Used to validate employee specialization
            on create, update, and import.
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setModalOpen(true);
            setError("");
          }}
        >
          + New Specialization
        </button>
      </div>

      {/* Trade filter pills */}
      <div className="filter-bar" style={{ marginTop: 20 }}>
        <div className="filter-row">
          <span className="filter-label">Trade</span>
          <button
            className={`tab-pill${tradeFilter === "" ? " active" : ""}`}
            onClick={() => setTradeFilter("")}
          >
            All
          </button>
          {TRADES.map((t) => (
            <button
              key={t}
              className={`tab-pill${tradeFilter === t ? " active" : ""}`}
              onClick={() => setTradeFilter(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrap" style={{ marginTop: 14 }}>
        {isLoading ? (
          <div className="empty-state">Loading…</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Trade</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {specs.map((s) => (
                <tr key={s._id}>
                  <td className="emp-name">{s.name}</td>
                  <td style={{ color: "var(--text-2)" }}>{s.trade}</td>
                  <td style={{ color: "var(--text-2)", fontSize: 12 }}>
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      className="icon-btn"
                      style={{ color: "var(--red)", borderColor: "var(--red)" }}
                      disabled={deactivateMutation.isPending}
                      onClick={() =>
                        window.confirm(`Deactivate "${s.name}"?`) &&
                        deactivateMutation.mutate(s._id)
                      }
                    >
                      Deactivate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!isLoading && specs.length === 0 && (
          <div className="empty-state">
            No active specializations{tradeFilter ? ` for ${tradeFilter}` : ""}.
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="overlay show">
          <div className="modal">
            <div className="modal-head">
              <h3>New Specialization</h3>
              <button
                className="modal-close"
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(form);
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
                    Name <span className="req">*</span>
                  </label>
                  <input
                    className="ff"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Spray Painter"
                  />
                </div>
                <div className="field">
                  <label>
                    Trade <span className="req">*</span>
                  </label>
                  <select
                    className="ff"
                    value={form.trade}
                    onChange={(e) =>
                      setForm({ ...form, trade: e.target.value })
                    }
                  >
                    {TRADES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
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
                  {createMutation.isPending ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
