import Modal from "./Modal";

// Used before every destructive action (delete, cancel).
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Keep it",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={loading ? () => {} : onCancel}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={loading}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Please wait..." : confirmText}
          </button>
        </>
      }
    >
      {typeof message === "string" ? <p>{message}</p> : message}
    </Modal>
  );
}
