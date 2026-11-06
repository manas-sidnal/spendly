"use client";

import { useState } from "react";
import { inr } from "@/lib/format";
import type { Expense } from "@/lib/types";
import ExpenseRow from "./ExpenseRow";

/** One day's expenses: the note you typed (or the category) next to its amount, with edit and delete buttons. */
export default function DayCard({
  title,
  subtitle,
  items,
  onDelete,
  onEdit,
}: {
  title: string;
  subtitle?: string;
  items: Expense[];
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const total = items.reduce((s, e) => s + e.amount, 0);

  return (
    <section className="card day-card">
      <div className="day-head">
        <div>
          <h2 className="day-title">{title}</h2>
          {subtitle && <span className="muted day-sub">{subtitle}</span>}
        </div>
        <strong className="day-total">{inr(total)}</strong>
      </div>

      <div className="day-body">
        {items.length === 0 ? (
          <div className="empty small">
            <span>No expenses</span>
          </div>
        ) : (
          <ul className="tx-list">
            {items.map((e) => (
              <ExpenseRow
                key={e.id}
                expense={e}
                meta={`${e.category}${e.payMethod ? ` · ${e.payMethod}` : ""}`}
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
    </section>
  );
}
