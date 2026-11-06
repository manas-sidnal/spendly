"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { categoryColor } from "@/lib/constants";
import { dayLabel, inr, monthLabel } from "@/lib/format";
import type { Expense } from "@/lib/types";
import ExpenseRow from "./ExpenseRow";
import { CategoryIcon, CloseIcon } from "./icons";

/**
 * Everything spent in one category for the viewed month, newest first. A full-height bottom sheet on phones,
 * a centred modal on desktop. `items` comes straight from the dashboard's state, so edits and deletes made
 * from here show up immediately.
 */
export default function CategoryDetail({
  category,
  month,
  today,
  items,
  isMobile,
  suspendKeys = false,
  onClose,
  onEdit,
  onDelete,
}: {
  category: string;
  month: string;
  today: string;
  items: Expense[];
  isMobile: boolean;
  /** True while the edit dialog is open on top, so Escape closes only that one. */
  suspendKeys?: boolean;
  onClose: () => void;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const total = items.reduce((s, e) => s + e.amount, 0);

  useEffect(() => {
    if (suspendKeys) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, suspendKeys]);

  const content = (
    <>
      <div className="cat-head" style={{ "--c": categoryColor(category) } as CSSProperties}>
        <span className="cat-tile" aria-hidden="true">
          <CategoryIcon name={category} width={22} height={22} />
        </span>
        <div className="cat-title">
          <h2>{category}</h2>
          <span>{monthLabel(month)}</span>
        </div>
        <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>

      <div className="cat-summary">
        <strong>{inr(total)}</strong>
        <span className="muted">
          {items.length} {items.length === 1 ? "expense" : "expenses"}
        </span>
      </div>

      <div className="cat-list">
        {items.length === 0 ? (
          <div className="empty small">
            <span>No {category.toLowerCase()} expenses this month</span>
          </div>
        ) : (
          <ul className="tx-list">
            {items.map((e) => (
              <ExpenseRow
                key={e.id}
                expense={e}
                meta={`${dayLabel(e.spentOn, today)}${e.payMethod ? ` · ${e.payMethod}` : ""}`}
                confirming={confirmId === e.id}
                onEdit={onEdit}
                onAskDelete={() => setConfirmId(e.id)}
                onCancelDelete={() => setConfirmId(null)}
                onConfirmDelete={() => {
                  setConfirmId(null);
                  onDelete(e.id);
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        <div className="sheet-backdrop" onClick={onClose} />
        <div className="sheet cat-sheet" role="dialog" aria-modal="true" aria-label={`${category} expenses`}>
          <span className="sheet-grab" />
          {content}
        </div>
      </>
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal cat-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${category} expenses`}
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </div>
    </div>
  );
}
