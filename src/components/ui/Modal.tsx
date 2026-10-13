import { useEffect, useId, useRef, type PropsWithChildren } from "react";
import { createPortal } from "react-dom";
import Button from "./Button";
type ModalProps = PropsWithChildren<{ isOpen: boolean; title: string; onClose: () => void }>;
/** Native modal dialogs provide focus trapping, Escape dismissal and inert background content. */
export default function Modal({ isOpen, title, onClose, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !isOpen) return;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog.showModal(); document.body.style.overflow = "hidden";
    return () => { dialog.close(); document.body.style.overflow = overflow; if (previousFocus instanceof HTMLElement) previousFocus.focus(); };
  }, [isOpen]);
  if (!isOpen) return null;
  return createPortal(<dialog ref={ref} aria-labelledby={titleId} onCancel={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }} className="app-dialog"><div className="dialog-content"><div className="mb-4 flex items-center justify-between gap-4"><h2 id={titleId} className="text-lg font-semibold">{title}</h2><Button type="button" variant="ghost" size="sm" onClick={onClose}>Close</Button></div>{children}</div></dialog>, document.body);
}
