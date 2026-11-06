"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { categoryColor } from "@/lib/constants";
import { inr, monthLabel, shiftMonth, shortMonth, toDateStr } from "@/lib/format";
import type { Expense } from "@/lib/types";
import AddExpense from "./AddExpense";
import CategoryBreakdown from "./CategoryBreakdown";
import DailyChart from "./DailyChart";
import TransactionList from "./TransactionList";
import { ArrowDownIcon, ArrowUpIcon, ChevronLeftIcon, ChevronRightIcon, LogoMark, LogoutIcon } from "./icons";

const sum = (list: Expense[]) => list.reduce((s, e) => s + e.amount, 0);
const dayOf = (e: Expense) => Number(e.spentOn.slice(8, 10));

export default function Dashboard() {
  // "today" and the selected month are set on the client only, so server and browser timezones can't disagree.
  const [today, setToday] = useState("");
  const [month, setMonth] = useState("");
  const [items, setItems] = useState<Expense[]>([]);
  const [prevItems, setPrevItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  useEffect(() => {
    const t = toDateStr(new Date());
    setToday(t);
    setMonth(t.slice(0, 7));
  }, []);

  const load = useCallback(async () => {
    if (!month) return;
    const id = ++requestId.current;
    setLoading(true);
    try {
      const [cur, prev] = await Promise.all([
        fetch(`/api/expenses?month=${month}`),
        fetch(`/api/expenses?month=${shiftMonth(month, -1)}`),
      ]);
      if (cur.status === 401 || prev.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!cur.ok) throw new Error("load failed");
      const curItems: Expense[] = await cur.json();
      const lastItems: Expense[] = prev.ok ? await prev.json() : [];
      if (id !== requestId.current) return; // a newer request superseded this one
      setItems(curItems);
      setPrevItems(lastItems);
      setError("");
    } catch {
      if (id === requestId.current) setError("Could not load expenses. Please try again.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (res.ok) setItems((list) => list.filter((e) => e.id !== id));
    else setError("Could not delete expense");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  function handleAdded(addedMonth: string) {
    // If the expense is in another month, jump there so it is visible.
    if (addedMonth !== month) setMonth(addedMonth);
    else load();
  }

  const stats = useMemo(() => {
    if (!month || !today) return null;
    const [y, m] = month.split("-").map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const isCurrent = today.slice(0, 7) === month;
    const daysElapsed = isCurrent ? Number(today.slice(8, 10)) : daysInMonth;

    const total = sum(items);

    const byCat: Record<string, number> = {};
    items.forEach((e) => (byCat[e.category] = (byCat[e.category] ?? 0) + e.amount));
    const catData = Object.entries(byCat)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const dayData = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, amount: 0 }));
    items.forEach((e) => {
      const slot = dayData[dayOf(e) - 1];
      if (slot) slot.amount += e.amount;
    });

    // Compare like with like: for the current month, only the same days of last month.
    const prevComparable = sum(prevItems.filter((e) => !isCurrent || dayOf(e) <= daysElapsed));
    const deltaPct = prevComparable > 0 ? ((total - prevComparable) / prevComparable) * 100 : null;

    return {
      total,
      isCurrent,
      daysElapsed,
      avg: daysElapsed > 0 ? total / daysElapsed : 0,
      projected: isCurrent && items.length > 0 ? (total / daysElapsed) * daysInMonth : null,
      top: catData[0]?.name ?? null,
      catData,
      dayData,
      deltaPct,
    };
  }, [items, prevItems, month, today]);

  if (!stats) return <div className="page" />;

  const prevLabel = shortMonth(shiftMonth(month, -1));
  const deltaDir = stats.deltaPct === null ? null : stats.deltaPct > 0 ? "up" : stats.deltaPct < 0 ? "down" : "flat";

  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <LogoMark />
            <span>Spendly</span>
          </div>

          <div className="month-switch">
            <button
              type="button"
              className="icon-btn"
              aria-label="Previous month"
              onClick={() => setMonth((m) => shiftMonth(m, -1))}
            >
              <ChevronLeftIcon />
            </button>
            <span aria-live="polite">{monthLabel(month)}</span>
            <button
              type="button"
              className="icon-btn"
              aria-label="Next month"
              onClick={() => setMonth((m) => shiftMonth(m, 1))}
            >
              <ChevronRightIcon />
            </button>
          </div>

          <div className="topbar-actions">
            <button type="button" className="icon-btn" onClick={logout} aria-label="Log out" title="Log out">
              <LogoutIcon />
            </button>
          </div>
        </div>
      </header>

      <main className={"content" + (loading ? " is-loading" : "")}>
        {error && (
          <div className="banner" role="alert">
            {error}
          </div>
        )}

        <section className="card hero">
          <div className="hero-main">
            <div className="eyebrow">Spent in {monthLabel(month)}</div>
            <div className="hero-amount">{inr(stats.total)}</div>
            <div className="hero-sub">
              {deltaDir && stats.deltaPct !== null && (
                <span className={`delta ${deltaDir}`}>
                  {deltaDir === "up" && <ArrowUpIcon />}
                  {deltaDir === "down" && <ArrowDownIcon />}
                  {Math.round(Math.abs(stats.deltaPct))}% vs {stats.isCurrent ? `1–${stats.daysElapsed} ` : ""}
                  {prevLabel}
                </span>
              )}
              {stats.projected !== null && (
                <span className="muted">On pace for {inr(Math.round(stats.projected))}</span>
              )}
            </div>
          </div>

          <dl className="hero-stats">
            <div>
              <dt>Daily average</dt>
              <dd>{inr(Math.round(stats.avg))}</dd>
            </div>
            <div>
              <dt>Transactions</dt>
              <dd>{items.length}</dd>
            </div>
            <div>
              <dt>Top category</dt>
              <dd>
                {stats.top ? (
                  <span className="top-cat" style={{ "--dot": categoryColor(stats.top) } as CSSProperties}>
                    <span className="dot" />
                    {stats.top}
                  </span>
                ) : (
                  "–"
                )}
              </dd>
            </div>
          </dl>
        </section>

        <div className="grid-2">
          <section className="card">
            <h2 className="card-title">Add expense</h2>
            <AddExpense defaultDate={today} onAdded={handleAdded} />
          </section>

          <section className="card">
            <h2 className="card-title">Where it went</h2>
            <CategoryBreakdown data={stats.catData} total={stats.total} />
          </section>
        </div>

        <section className="card">
          <h2 className="card-title">Daily spend</h2>
          <DailyChart data={stats.dayData} monthShort={shortMonth(month)} />
        </section>

        <section className="card">
          <h2 className="card-title">
            Transactions <span className="count">{items.length}</span>
          </h2>
          <TransactionList items={items} today={today} loading={loading} onDelete={remove} />
        </section>
      </main>
    </div>
  );
}
