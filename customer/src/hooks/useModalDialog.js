import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export function useModalDialog({ isOpen, dialogRef, initialFocusRef, onRequestClose }) {
  const openerRef = useRef(null);
  const onRequestCloseRef = useRef(onRequestClose);
  onRequestCloseRef.current = onRequestClose;

  useEffect(() => {
    if (!isOpen) return undefined;

    // Capture the active opener before or at the moment overlay activates
    openerRef.current = document.activeElement;

    const focusTarget = () => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else if (dialogRef?.current) {
        const firstFocusable = dialogRef.current.querySelector(FOCUSABLE_SELECTOR);
        if (firstFocusable) {
          firstFocusable.focus();
        } else {
          dialogRef.current.focus?.();
        }
      }
    };

    const frameId = requestAnimationFrame(focusTarget);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onRequestCloseRef.current?.();
        return;
      }

      if (event.key === "Tab") {
        if (!dialogRef?.current) return;

        const focusable = Array.from(
          dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR)
        ).filter((el) => el.offsetParent !== null || el.getClientRects().length > 0);

        if (focusable.length === 0) {
          event.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === first || !dialogRef.current.contains(document.activeElement)) {
            event.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !dialogRef.current.contains(document.activeElement)) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      cancelAnimationFrame(frameId);
      document.removeEventListener("keydown", handleKeyDown, true);
      const opener = openerRef.current;
      if (opener && typeof opener.focus === "function" && document.contains(opener)) {
        opener.focus();
      }
    };
  }, [isOpen, dialogRef, initialFocusRef]);
}
