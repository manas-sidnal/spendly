"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { categoryColor } from "@/lib/constants";
import { dayLabel, inr } from "@/lib/format";
import type { Expense } from "@/lib/types";
import { TrashIcon } from "./icons";

export default function TransactionList({
  items,
  today,
  loading,
  onDelete,
}: {
  items: Expense[];
  today: string;
  loading: boolean;
  onDelete: (id: string) => void;
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const e of items) {
      const list = map.get(e.spentOn);
      if (list) list.push(e);
      else map.set(e.spentOn, [e]);
    }
    return Array.from(map, ([date, list]) => ({
      date,
      list,
      total: list.reduce((s, e) => s + e.amount, 0),
    }));
  }, [items]);

  if (!loading && items.length === 0) {
    return (
      <div className="empty">
        <strong>No expenses this month</strong>
        <span>Add one above and it will show up here.</span>
      </div>
    );
  }

  return (
    <div>
      {groups.map((g) => (
        <div className="tx-group" key={g.date}>
          <div className="tx-head">
            <span>{dayLabel(g.date, today)}</span>
            <span>{inr(g.total)}</span>
          </div>
          <ul className="tx-list">
            {g.list.map((e) => (
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
        </div>
      ))}
    </div>
  );
}
