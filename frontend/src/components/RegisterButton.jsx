import { useState } from "react";
import * as registrationService from "../services/registrationService";
import useToast from "../hooks/useToast";
import { ACTIVE_STATUSES, canCancelRegistration, getErrorMessage, getRegisterState } from "../utils/format";
import StatusBadge from "./StatusBadge";
import Modal from "./Modal";
import ConfirmDialog from "./ConfirmDialog";

// Shows the right control for a student: Register, a disabled reason, or status + Cancel.
// `event` must include `myRegistration` (the API adds it for students). onChanged() reloads the data.
export default function RegisterButton({ event, onChanged }) {
  const { showToast } = useToast();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);

  const reg = event.myRegistration;
  const isActive = reg && ACTIVE_STATUSES.includes(reg.status);

  const handleRegister = async () => {
    setBusy(true);
    try {
      const res = await registrationService.registerForEvent(event._id, remarks.trim());
      showToast(res.message);
      setRegisterOpen(false);
      setRemarks("");
      onChanged?.();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
      setRegisterOpen(false);
      onChanged?.(); // refresh, the event may have just filled up
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    setBusy(true);
    try {
      const res = await registrationService.cancelRegistration(reg._id);
      showToast(res.message);
      setCancelOpen(false);
      onChanged?.();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
      setCancelOpen(false);
    } finally {
      setBusy(false);
    }
  };

  if (isActive) {
    return (
      <div className="reg-state">
        <span className="reg-label">Registered</span>
        <StatusBadge status={reg.status} />
        {canCancelRegistration(event) && (
          <>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setCancelOpen(true)}>
              Cancel registration
            </button>
            <ConfirmDialog
              open={cancelOpen}
              danger
              title="Cancel your registration?"
              message={`You will give up your seat for "${event.title}". You can register again later if seats are still available.`}
              confirmText="Cancel registration"
              loading={busy}
              onConfirm={handleCancel}
              onCancel={() => setCancelOpen(false)}
            />
          </>
        )}
      </div>
    );
  }

  if (reg?.status === "Rejected") {
    return (
      <div className="reg-state">
        <span className="reg-label">Registration</span>
        <StatusBadge status="Rejected" />
      </div>
    );
  }

  const { canRegister, reason } = getRegisterState(event);
  if (!canRegister) {
    return (
      <button type="button" className="btn btn-sm" disabled>
        {reason}
      </button>
    );
  }

  return (
    <>
      <button type="button" className="btn btn-primary btn-sm" onClick={() => setRegisterOpen(true)}>
        Register
      </button>
      <Modal
        open={registerOpen}
        title={`Register for ${event.title}`}
        onClose={() => !busy && setRegisterOpen(false)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setRegisterOpen(false)} disabled={busy}>
              Not now
            </button>
            <button type="button" className="btn btn-primary" onClick={handleRegister} disabled={busy}>
              {busy ? "Registering..." : "Confirm registration"}
            </button>
          </>
        }
      >
        <div className="field">
          <label htmlFor={`remarks-${event._id}`}>Remarks for the organizer (optional)</label>
          <textarea
            id={`remarks-${event._id}`}
            rows={3}
            maxLength={300}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Dietary needs, questions, team name..."
          />
        </div>
      </Modal>
    </>
  );
}
