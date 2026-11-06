"use client";

import { useRef, useState } from "react";
import { monthLabel, shortMonth } from "@/lib/format";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "./icons";
import { useDismiss } from "./useDismiss";

/** The month name in the top bar: click it to jump to any month. */
export default function MonthPicker({
  month,
  currentMonth,
  onSelect,
}: {
  month: string;
  currentMonth: string;
  onSelect: (month: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(Number(month.slice(0, 4)));
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));

  function toggle() {
    if (!open) setYear(Number(month.slice(0, 4)));
    setOpen((o) => !o);
  }

  function pick(m: string) {
    onSelect(m);
    setOpen(false);
  }

  return (
    <div className="month-picker" ref={ref}>
      <button type="button" className="month-btn" aria-haspopup="dialog" aria-expanded={open} onClick={toggle}>
        {monthLabel(month)}
        <ChevronDownIcon width={14} height={14} />
      </button>

      {open && (
        <div className="popover month-pop" role="dialog" aria-label="Choose month">
          <div className="pop-head">
            <button type="button" className="icon-btn" aria-label="Previous year" onClick={() => setYear((y) => y - 1)}>
              <ChevronLeftIcon />
            </button>
            <strong>{year}</strong>
            <button type="button" className="icon-btn" aria-label="Next year" onClick={() => setYear((y) => y + 1)}>
              <ChevronRightIcon />
            </button>
          </div>
          <div className="month-grid">
            {Array.from({ length: 12 }, (_, i) => {
              const value = `${year}-${String(i + 1).padStart(2, "0")}`;
              const cls = "month-cell" + (value === month ? " active" : "") + (value === currentMonth ? " current" : "");
              return (
                <button key={value} type="button" className={cls} onClick={() => pick(value)}>
                  {shortMonth(value)}
                </button>
              );
            })}
          </div>
          <button type="button" className="text-btn pop-foot" onClick={() => pick(currentMonth)}>
            Jump to this month
          </button>
        </div>
      )}
    </div>
  );
}
