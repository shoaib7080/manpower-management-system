import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  createSpecialization,
  deactivateSpecialization,
  getSpecializations,
} from "../api/services";
import { TRADES } from "../components/manpower/employeeUtils";
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

const EMPTY = { name: "", trade: TRADES[0] };

const pillCls = (active) =>
  `px-2.5 py-1.5 rounded text-label-sm font-medium border whitespace-nowrap ${
    active
      ? "bg-primary-container text-on-primary border-primary-container font-semibold"
      : "bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface-container-low"
  }`;

const th =
  "text-left text-label-sm uppercase text-on-surface-variant bg-surface-container-low px-3.5 py-2.5 border-b border-outline-variant whitespace-nowrap";
const td = "px-3.5 py-2.5 border-b border-outline-variant align-middle";

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
      <div className="flex items-start justify-between gap-5 flex-wrap mb-1">
        <div>
          <h1 className="text-headline-sm text-on-background">
            Specializations
          </h1>
          <div className="text-body-sm text-on-surface-variant mt-1">
            Admin-managed lookup list. Used to validate employee specialization
            on create, update, and import.
          </div>
        </div>
        <button
          className={btnPrimary}
          onClick={() => {
            setModalOpen(true);
            setError("");
          }}
        >
          + New Specialization
        </button>
      </div>

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
          {TRADES.map((t) => (
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

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden mt-3.5">
        {isLoading ? (
          <div className="text-center text-outline text-body-sm py-8">
            Loading…
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Name", "Trade", "Created", ""].map((h) => (
                  <th key={h} className={th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {specs.map((s) => (
                <tr key={s._id} className="hover:bg-surface-container-low">
                  <td className={`${td} font-semibold text-on-surface text-body-sm`}>
                    {s.name}
                  </td>
                  <td className={`${td} text-body-sm text-on-surface-variant`}>
                    {s.trade}
                  </td>
                  <td className={`${td} text-body-sm text-on-surface-variant`}>
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                  <td className={td}>
                    <button
                      className={`${iconBtn} text-error border-error hover:bg-error-container/20`}
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
          <div className="text-center text-outline text-body-sm py-8">
            No active specializations{tradeFilter ? ` for ${tradeFilter}` : ""}.
          </div>
        )}
      </div>

      {modalOpen && (
        <Overlay>
          <ModalShell>
            <ModalHead
              title="New Specialization"
              onClose={() => setModalOpen(false)}
            />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(form);
              }}
            >
              <ModalBody>
                {error && <WarnBox>{error}</WarnBox>}
                <Field label="Name" required>
                  <input
                    className={inputCls}
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Spray Painter"
                  />
                </Field>
                <Field label="Trade" required>
                  <select
                    className={inputCls}
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
                  {createMutation.isPending ? "Creating…" : "Create"}
                </button>
              </ModalFoot>
            </form>
          </ModalShell>
        </Overlay>
      )}
    </div>
  );
}
