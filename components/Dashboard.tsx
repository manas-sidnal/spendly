"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { EXCLUDED_FROM_DAILY_AVG, categoryColor } from "@/lib/constants";
import { inr, monthLabel, shiftDate, shiftMonth, shortDate, shortMonth, toDateStr } from "@/lib/format";
import type { Expense } from "@/lib/types";
import AddExpense from "./AddExpense";
import CategoryBreakdown from "./CategoryBreakdown";
import DailyChart from "./DailyChart";
import DayCard from "./DayCard";
import ExpenditureView from "./ExpenditureView";
import MonthPicker from "./MonthPicker";
import UserMenu from "./UserMenu";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LayoutIcon,
  ListIcon,
  LogoMark,
  MenuIcon,
} from "./icons";

const sum = (list: Expense[]) => list.reduce((s, e) => s + e.amount, 0);
const dayOf = (e: Expense) => Number(e.spentOn.slice(8, 10));
const isExcluded = (e: Expense) => EXCLUDED_FROM_DAILY_AVG.includes(e.category);

type View = "dashboard" | "expenses";
const RECENT_TITLES = ["Today", "Yesterday", "Day before"];

export default function Dashboard() {
  // "today" and the selected month are set on the client only, so server and browser timezones can't disagree.
  const [today, setToday] = useState("");
  const [month, setMonth] = useState("");
  // Expenses cached per YYYY-MM. Besides the selected month (and the one before, for the comparison) we always
  // hold the real current and previous month, so the Today / Yesterday / Day before cards work on any month.
  const [byMonth, setByMonth] = useState<Record<string, Expense[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<View>("dashboard");
  const [navOpen, setNavOpen] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const t = toDateStr(new Date());
    setToday(t);
    setMonth(t.slice(0, 7));
  }, []);

  const load = useCallback(async () => {
    if (!month || !today) return;
    const id = ++requestId.current;
    setLoading(true);
    try {
      const thisMonth = today.slice(0, 7);
      const wanted = Array.from(new Set([month, shiftMonth(month, -1), thisMonth, shiftMonth(thisMonth, -1)]));
      const responses = await Promise.all(wanted.map((m) => fetch(`/api/expenses?month=${m}`)));
      if (responses.some((r) => r.status === 401)) {
        window.location.href = "/login";
        return;
      }
      if (!responses[0].ok) throw new Error("load failed");
      const lists = await Promise.all(
        responses.map((r) => (r.ok ? (r.json() as Promise<Expense[]>) : Promise.resolve([] as Expense[]))),
      );
      if (id !== requestId.current) return; // a newer request superseded this one
      setByMonth((prev) => ({ ...prev, ...Object.fromEntries(wanted.map((m, i) => [m, lists[i]])) }));
      setError("");
    } catch {
      if (id === requestId.current) setError("Could not load expenses. Please try again.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [month, today]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (res.ok) {
      setByMonth((all) => Object.fromEntries(Object.entries(all).map(([m, list]) => [m, list.filter((e) => e.id !== id)])));
    } else setError("Could not delete expense");
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

  function goTo(next: View) {
    setView(next);
    setNavOpen(false);
  }

  const items = useMemo(() => byMonth[month] ?? [], [byMonth, month]);
  const prevItems = useMemo(() => (month ? (byMonth[shiftMonth(month, -1)] ?? []) : []), [byMonth, month]);

  const recentDays = useMemo(() => {
    if (!today) return [];
    const thisMonth = today.slice(0, 7);
    const pool = [...(byMonth[thisMonth] ?? []), ...(byMonth[shiftMonth(thisMonth, -1)] ?? [])];
    return RECENT_TITLES.map((title, i) => {
      const date = shiftDate(today, -i);
      return { title, date, items: pool.filter((e) => e.spentOn === date) };
    });
  }, [byMonth, today]);

  const stats = useMemo(() => {
    if (!month || !today) return null;
    const [y, m] = month.split("-").map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const isCurrent = today.slice(0, 7) === month;
    const daysElapsed = isCurrent ? Number(today.slice(8, 10)) : daysInMonth;

    const total = sum(items);
    // Rent and bills are lump sums: keep them in the total, but out of the per-day average and the pace.
    const fixedTotal = sum(items.filter(isExcluded));
    const dailyTotal = total - fixedTotal;
    const avg = daysElapsed > 0 ? dailyTotal / daysElapsed : 0;

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
      avg,
      // Pace = what rent/bills already cost + everyday spending continued at the current daily average.
      projected: isCurrent && items.length > 0 ? fixedTotal + avg * daysInMonth : null,
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
          <div className="topbar-left">
            <button
              type="button"
              className="icon-btn nav-toggle"
              aria-label="Open menu"
              aria-expanded={navOpen}
              onClick={() => setNavOpen((o) => !o)}
            >
              <MenuIcon />
            </button>
            <div className="brand">
              <LogoMark />
              <span>Spendly</span>
            </div>
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
            <MonthPicker month={month} currentMonth={today.slice(0, 7)} onSelect={setMonth} />
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
            <UserMenu onLogout={logout} />
          </div>
        </div>
      </header>

      <div className="shell">
        <nav className={"rail" + (navOpen ? " open" : "")} aria-label="Main">
          <button
            type="button"
            className="rail-item rail-toggle"
            aria-label={navOpen ? "Collapse menu" : "Expand menu"}
            aria-expanded={navOpen}
            onClick={() => setNavOpen((o) => !o)}
          >
            <MenuIcon />
            <span className="rail-label">Menu</span>
          </button>
          <button
            type="button"
            className={"rail-item" + (view === "dashboard" ? " active" : "")}
            title="Dashboard"
            aria-current={view === "dashboard" ? "page" : undefined}
            onClick={() => goTo("dashboard")}
          >
            <LayoutIcon />
            <span className="rail-label">Dashboard</span>
          </button>
          <button
            type="button"
            className={"rail-item" + (view === "expenses" ? " active" : "")}
            title="View expenditure"
            aria-current={view === "expenses" ? "page" : undefined}
            onClick={() => goTo("expenses")}
          >
            <ListIcon />
            <span className="rail-label">View expenditure</span>
          </button>
        </nav>
        {navOpen && <div className="rail-backdrop" onClick={() => setNavOpen(false)} />}

        <main className={"content" + (loading ? " is-loading" : "")}>
          {error && (
            <div className="banner" role="alert">
              {error}
            </div>
          )}

          {view === "expenses" ? (
            <ExpenditureView items={items} month={month} today={today} loading={loading} onDelete={remove} />
          ) : (
            <div className="dash-grid">
              <section className="card add-card">
                <h2 className="card-title">Add expense</h2>
                <AddExpense defaultDate={today} onAdded={handleAdded} />
              </section>

              <section className="card kpi-card">
                <div className="hero">
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
                      <span className="stat-note">excl. rent &amp; bills</span>
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
                </div>

                <div className="kpi-split">
                  <div className="sub">
                    <h2 className="card-title">Where it went</h2>
                    <div className="sub-body scroll">
                      <CategoryBreakdown data={stats.catData} total={stats.total} />
                    </div>
                  </div>
                  <div className="sub">
                    <h2 className="card-title">Daily spend</h2>
                    <div className="sub-body fill">
                      <DailyChart data={stats.dayData} monthShort={shortMonth(month)} />
                    </div>
                  </div>
                </div>
              </section>

              <div className="recent">
                {recentDays.map((d) => (
                  <DayCard key={d.date} title={d.title} subtitle={shortDate(d.date)} items={d.items} onDelete={remove} />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
