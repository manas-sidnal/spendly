"use client";

import type { CSSProperties } from "react";
import { categoryColor } from "@/lib/constants";
import { inr } from "@/lib/format";
import type { Expense } from "@/lib/types";
import { CategoryIcon, PencilIcon, TrashIcon } from "./icons";

/**
 * One expense line: category icon, note (or category), a small meta line, the amount and the edit / delete
 * buttons. Delete asks for confirmation inline; the parent list owns which row is confirming.
 */
export default function ExpenseRow({
  expense: e,
  meta,
  confirming,
  onEdit,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
}: {
  expense: Expense;
  meta: string;
  confirming: boolean;
  onEdit: (expense: Expense) => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}) {
  const name = e.note || e.category;

  return (
    <li className="tx-row" style={{ "--c": categoryColor(e.category) } as CSSProperties}>
      <span className="tx-icon" aria-hidden="true">
        <CategoryIcon name={e.category} width={20} height={20} />
      </span>
      <div className="tx-main">
        <div className="tx-title">{name}</div>
        <div className="tx-sub">{meta}</div>
      </div>
      <div className="tx-amount">{inr(e.amount)}</div>
      <div className="tx-actions">
        {confirming ? (
          <>
            <button type="button" className="text-btn danger" onClick={onConfirmDelete}>
              Delete
            </button>
            <button type="button" className="text-btn" onClick={onCancelDelete}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="icon-btn tx-edit"
              aria-label={`Edit ${name}`}
              title="Edit"
              onClick={() => onEdit(e)}
            >
              <PencilIcon />
            </button>
            <button
              type="button"
              className="icon-btn tx-del"
              aria-label={`Delete ${name} expense`}
              title="Delete"
              onClick={onAskDelete}
            >
              <TrashIcon />
            </button>
          </>
        )}
      </div>
    </li>
  );
}
