"use client";

import { useState, type CSSProperties } from "react";
import { categoryColor } from "@/lib/constants";
import { inr } from "@/lib/format";
import type { Expense } from "@/lib/types";
import { TrashIcon } from "./icons";

/** One day's expenses: the note you typed (or the category) next to its amount. */
export default function DayCard({
  title,
  subtitle,
  items,
  onDelete,
}: {
  title: string;
  subtitle?: string;
  items: Expense[];
  onDelete: (id: string) => void;
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
              <li className="tx-row" key={e.id} style={{ "--c": categoryColor(e.category) } as CSSProperties}>
                <span className="tx-icon" aria-hidden="true">
                  {e.category.charAt(0)}
                </span>
                <div className="tx-main">
                  <div className="tx-title">{e.note || e.category}</div>
                  <div className="tx-sub">
                    {e.category}
                    {e.payMethod ? ` · ${e.payMethod}` : ""}
                  </div>
                </div>
                <div className="tx-amount">{inr(e.amount)}</div>
                <div className="tx-actions">
                  {confirmId === e.id ? (
                    <>
                      <button
                        type="button"
                        className="text-btn danger"
                        onClick={() => {
                          setConfirmId(null);
                          onDelete(e.id);
                        }}
                      >
                        Delete
                      </button>
                      <button type="button" className="text-btn" onClick={() => setConfirmId(null)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="icon-btn tx-del"
                      aria-label={`Delete ${e.note || e.category} expense`}
                      title="Delete"
                      onClick={() => setConfirmId(e.id)}
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
