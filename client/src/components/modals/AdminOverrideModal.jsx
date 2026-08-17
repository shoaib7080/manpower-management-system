import { useEffect, useState } from "react";
import useDashboardStore from "../../store/useDashboardStore";
import {
  Field,
  ModalBody,
  ModalFoot,
  ModalHead,
  ModalShell,
  Overlay,
  WarnBox,
  btnDangerOutline,
  btnGhost,
  inputCls,
} from "../ui/Modal";

export default function AdminOverrideModal() {
  const { open, pending } = useDashboardStore((s) => s.ui.admin);
  const closeAdminModal = useDashboardStore((s) => s.closeAdminModal);
  const confirmAdminOverride = useDashboardStore((s) => s.confirmAdminOverride);

  const [pin, setPin] = useState("");

  useEffect(() => {
    if (open) setPin("");
  }, [open]);

  if (!open || !pending) return null;

  return (
    <Overlay onBackdropClick={closeAdminModal}>
      <ModalShell>
        <ModalHead title="Locked Assignment" onClose={closeAdminModal} />

        <ModalBody>
          <WarnBox label="Locked assignment">
            <b className="text-on-error-container">{pending.workerName}</b> is{" "}
            <b className="text-on-error-container">{pending.status}</b> and
            locked against swap or cancellation. Level 1 Admin authorization
            is required to override this hard lock.
          </WarnBox>

          <Field label="Admin Override PIN" required>
            <input
              type="password"
              className={inputCls}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter Level 1 Admin PIN"
            />
          </Field>
        </ModalBody>

        <ModalFoot>
          <button className={btnGhost} onClick={closeAdminModal}>
            Cancel
          </button>
          <button
            className={btnDangerOutline}
            disabled={pin.trim().length === 0}
            onClick={confirmAdminOverride}
          >
            Authorize Override
          </button>
        </ModalFoot>
      </ModalShell>
    </Overlay>
  );
}
