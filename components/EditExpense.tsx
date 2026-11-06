"use client";

import { useEffect } from "react";
import type { Expense } from "@/lib/types";
import AddExpense from "./AddExpense";
import { CloseIcon } from "./icons";

/** Edit dialog: a bottom sheet on phones, a centred modal on desktop. Both reuse the add-expense form. */
export default function EditExpense({
  expense,
  isMobile,
  offline = false,
  onClose,
  onSaved,
}: {
  expense: Expense;
  isMobile: boolean;
  offline?: boolean;
  onClose: () => void;
  onSaved: (saved: Expense) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const form = (
    <AddExpense
      key={expense.id}
      expense={expense}
      defaultDate={expense.spentOn}
      onSaved={onSaved}
      offline={offline}
      // Don't pop the phone keyboard over the form: you usually come here to change one thing.
      autoFocus={!isMobile}
    />
  );

  if (isMobile) {
    return (
      <>
        <div className="sheet-backdrop top" onClick={onClose} />
        <div className="sheet top" role="dialog" aria-modal="true" aria-label="Edit expense">
          <span className="sheet-grab" />
          <div className="sheet-head">
            <h2>Edit expense</h2>
            <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
              <CloseIcon />
            </button>
          </div>
          {form}
        </div>
      </>
    );
  }

  return (
    <div className="modal-backdrop top" onClick={onClose}>
      <div
        className="modal edit-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Edit expense"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="edit-head">
          <h2>Edit expense</h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        {form}
      </div>
    </div>
  );
}
