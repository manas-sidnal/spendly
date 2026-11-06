"use client";

import { useMemo, useState, type CSSProperties, type KeyboardEvent } from "react";
import { categoryColor } from "@/lib/constants";
import { dayLabel, inr, inrCompact } from "@/lib/format";
import type { Expense } from "@/lib/types";
import DayCard from "./DayCard";
import { CategoryIcon, CloseIcon } from "./icons";
import { useMediaQuery } from "./useMediaQuery";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const GLANCE_MAX = 4; // icons shown per day cell on phones before "+N"

/** "View expenditure" tab: a month calendar with each day's expenses written into its cell. */
export default function ExpenditureView({
  items,
  month,
  today,
  loading,
  onDelete,
  onEdit,
}: {
  items: Expense[];
  month: string;
  today: string;
  loading: boolean;
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
}) {
  // Remember the picked day together with its month, so changing month falls back to the default.
  const isMobile = useMediaQuery("(max-width: 860px)");
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

  // On desktop today is pre-selected; on phones nothing is, so no sheet pops up uninvited.
  const defaultDay = !isMobile && today.startsWith(month) ? today : null;
  const active = picked && picked.month === month ? picked.date : defaultDay;
  const activeItems = active ? (byDate.get(active) ?? []) : [];

  function select(date: string) {
    setPicked({ month, date: date === active ? null : date });
  }

  function closeDay() {
    setPicked({ month, date: null });
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
                  {total > 0 && <span className="cal-total">{isMobile ? inrCompact(total) : inr(total)}</span>}
                </div>
                <ul className="cal-items">
                  {list.map((e) => (
                    <li key={e.id} style={{ "--c": categoryColor(e.category) } as CSSProperties}>
                      <CategoryIcon name={e.category} width={13} height={13} className="cat-glyph" />
                      <span className="cal-note">{e.note || e.category}</span>
                      <span className="cal-amt">{inr(e.amount)}</span>
                    </li>
                  ))}
                </ul>
                {/* Phones: cells are too narrow for text, so show a glance of category icons instead. */}
                {list.length > 0 && (
                  <div className="cal-glance" aria-hidden="true">
                    {list.slice(0, GLANCE_MAX).map((e) => (
                      <CategoryIcon
                        key={e.id}
                        name={e.category}
                        width={13}
                        height={13}
                        className="cat-glyph"
                        style={{ "--c": categoryColor(e.category) } as CSSProperties}
                      />
                    ))}
                    {list.length > GLANCE_MAX && <span className="more">+{list.length - GLANCE_MAX}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {!loading && items.length === 0 && <div className="cal-empty muted">No expenses this month</div>}
      </div>

      {isMobile ? (
        active && (
          <>
            <div className="sheet-backdrop" onClick={closeDay} />
            <div className="sheet" role="dialog" aria-label="Day details">
              <span className="sheet-grab" />
              <button type="button" className="icon-btn sheet-close" aria-label="Close" onClick={closeDay}>
                <CloseIcon />
              </button>
              <DayCard
                key={active}
                title={dayLabel(active, today)}
                subtitle={`${activeItems.length} ${activeItems.length === 1 ? "expense" : "expenses"}`}
                items={activeItems}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            </div>
          </>
        )
      ) : (
        <aside className="cal-side">
          {active ? (
            <DayCard
              key={active}
              title={dayLabel(active, today)}
              subtitle={`${activeItems.length} ${activeItems.length === 1 ? "expense" : "expenses"}`}
              items={activeItems}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ) : (
            <div className="card cal-hint">
              <strong>Pick a day</strong>
              <span>Select a date to see its expenses in full, then edit or delete entries.</span>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}
