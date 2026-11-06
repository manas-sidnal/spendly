"use client";

import { useMemo, useState, type CSSProperties, type KeyboardEvent } from "react";
import { categoryColor } from "@/lib/constants";
import { dayLabel, inr } from "@/lib/format";
import type { Expense } from "@/lib/types";
import DayCard from "./DayCard";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "View expenditure" tab: a month calendar with each day's expenses written into its cell. */
export default function ExpenditureView({
  items,
  month,
  today,
  loading,
  onDelete,
}: {
  items: Expense[];
  month: string;
  today: string;
  loading: boolean;
  onDelete: (id: string) => void;
}) {
  // Remember the picked day together with its month, so changing month falls back to the default.
  const [picked, setPicked] = useState<{ month: string; date: string | null } | null>(null);

  const { cells, weeks, byDate } = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const lead = new Date(y, m - 1, 1).getDay();
    const daysInMonth = new Date(y, m, 0).getDate();
    const map = new Map<string, Expense[]>();
    for (const e of items) {
      const list = map.get(e.spentOn);
      if (list) list.push(e);
      else map.set(e.spentOn, [e]);
    }
    const weekCount = Math.ceil((lead + daysInMonth) / 7);
    const all: (number | null)[] = Array.from({ length: weekCount * 7 }, (_, i) => {
      const day = i - lead + 1;
      return day >= 1 && day <= daysInMonth ? day : null;
    });
    return { cells: all, weeks: weekCount, byDate: map };
  }, [items, month]);

  const active = picked && picked.month === month ? picked.date : today.startsWith(month) ? today : null;
  const activeItems = active ? (byDate.get(active) ?? []) : [];

  function select(date: string) {
    setPicked({ month, date: date === active ? null : date });
  }

  function onKey(e: KeyboardEvent<HTMLDivElement>, date: string) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      select(date);
    }
  }

  return (
    <div className="cal-view">
      <div className="cal-main">
        <div className="cal-weekdays" aria-hidden="true">
          {WEEKDAYS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="cal-grid" style={{ "--weeks": weeks } as CSSProperties}>
          {cells.map((day, idx) => {
            if (day === null) return <div className="cal-cell blank" key={idx} />;
            const date = `${month}-${String(day).padStart(2, "0")}`;
            const list = byDate.get(date) ?? [];
            const total = list.reduce((s, e) => s + e.amount, 0);
            const cls =
              "cal-cell" + (date === today ? " today" : "") + (date === active ? " selected" : "");
            return (
              <div
                key={idx}
                className={cls}
                role="button"
                tabIndex={0}
                aria-pressed={date === active}
                aria-label={`${dayLabel(date, today)}, ${list.length} expenses, ${inr(total)}`}
                onClick={() => select(date)}
                onKeyDown={(e) => onKey(e, date)}
              >
                <div className="cal-day">
                  <span className="cal-num">{day}</span>
                  {total > 0 && <span className="cal-total">{inr(total)}</span>}
                </div>
                <ul className="cal-items">
                  {list.map((e) => (
                    <li key={e.id} style={{ "--c": categoryColor(e.category) } as CSSProperties}>
                      <span className="dot" />
                      <span className="cal-note">{e.note || e.category}</span>
                      <span className="cal-amt">{inr(e.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        {!loading && items.length === 0 && <div className="cal-empty muted">No expenses this month</div>}
      </div>

      <aside className="cal-side">
        {active ? (
          <DayCard
            key={active}
            title={dayLabel(active, today)}
            subtitle={`${activeItems.length} ${activeItems.length === 1 ? "expense" : "expenses"}`}
            items={activeItems}
            onDelete={onDelete}
          />
        ) : (
          <div className="card cal-hint">
            <strong>Pick a day</strong>
            <span>Select a date to see its expenses in full and delete entries.</span>
          </div>
        )}
      </aside>
    </div>
  );
}
