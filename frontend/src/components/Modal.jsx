import { useEffect, useRef } from "react";

// Generic accessible dialog. Closes on Escape or a click outside.
export default function Modal({ open, title, onClose, children, footer }) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose; // always call the latest onClose without re-running the effect

  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (e) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", handleKey);
    dialogRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={dialogRef}>
        <h2 className="modal-title">{title}</h2>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
