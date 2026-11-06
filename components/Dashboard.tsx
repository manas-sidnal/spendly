"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { EXCLUDED_FROM_DAILY_AVG, RENT_CATEGORY, categoryColor } from "@/lib/constants";
import { inr, monthLabel, shiftDate, shiftMonth, shortDate, shortMonth, toDateStr } from "@/lib/format";
import type { Expense } from "@/lib/types";
import AddExpense from "./AddExpense";
import CategoryBreakdown from "./CategoryBreakdown";
import CategoryDetail from "./CategoryDetail";
import DailyChart from "./DailyChart";
import DayCard from "./DayCard";
import EditExpense from "./EditExpense";
import ExpenditureView from "./ExpenditureView";
import MonthPicker from "./MonthPicker";
import UserMenu from "./UserMenu";
import { useMediaQuery } from "./useMediaQuery";
import { useOnlineStatus } from "./useOnlineStatus";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarIcon,
  CategoryIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  LayoutIcon,
  ListIcon,
  LogoMark,
  MenuIcon,
  PlusIcon,
} from "./icons";

const sum = (list: Expense[]) => list.reduce((s, e) => s + e.amount, 0);
const dayOf = (e: Expense) => Number(e.spentOn.slice(8, 10));
const isExcluded = (e: Expense) => EXCLUDED_FROM_DAILY_AVG.includes(e.category);
const isRent = (e: Expense) => e.category === RENT_CATEGORY;

type View = "dashboard" | "expenses";
const RECENT_TITLES = ["Today", "Yesterday", "Day before"];

/**
 * Puts an edited expense into a month's list. Same date: it keeps its place. New date: top of that day's group,
 * which matches the server order (date, newest first).
 */
function upsert(list: Expense[], updated: Expense): Expense[] {
  const at = list.findIndex((e) => e.id === updated.id);
  if (at !== -1 && list[at].spentOn === updated.spentOn) return list.map((e, i) => (i === at ? updated : e));
  const rest = list.filter((e) => e.id !== updated.id);
  const pos = rest.findIndex((e) => e.spentOn <= updated.spentOn);
  return pos === -1 ? [...rest, updated] : [...rest.slice(0, pos), updated, ...rest.slice(pos)];
}

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
  const [addOpen, setAddOpen] = useState(false); // phone-only "add expense" bottom sheet
  const [editing, setEditing] = useState<Expense | null>(null);
  const [categoryView, setCategoryView] = useState<string | null>(null); // category whose expenses are open
  const isMobile = useMediaQuery("(max-width: 860px)");
  const requestId = useRef(0);
  const online = useOnlineStatus();
  const wasOnline = useRef(true);

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

  // Refresh once when the connection comes back.
  useEffect(() => {
    if (online && !wasOnline.current) load();
    wasOnline.current = online;
  }, [online, load]);

  async function remove(id: string) {
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (res.ok) {
        setByMonth((all) => Object.fromEntries(Object.entries(all).map(([m, list]) => [m, list.filter((e) => e.id !== id)])));
        return;
      }
    } catch {
      // network failure: reported below
    }
    setError("Could not delete expense");
  }

  const closeEdit = useCallback(() => setEditing(null), []);
  const closeCategory = useCallback(() => setCategoryView(null), []);

  // An edit can change the amount, category and date, so move the row between the cached months too.
  // We stay on the month being viewed: if the expense moved to another month it simply leaves this view.
  function handleSaved(saved: Expense) {
    setEditing(null);
    setError("");
    setByMonth((all) => {
      const target = saved.spentOn.slice(0, 7);
      const next: Record<string, Expense[]> = {};
      for (const [m, list] of Object.entries(all)) {
        next[m] = m === target ? upsert(list, saved) : list.filter((e) => e.id !== saved.id);
      }
      return next;
    });
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  function handleAdded(addedMonth: string) {
    setAddOpen(false);
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

  // Derived from state (not copied), so an edit or delete inside the category dialog updates it live.
  // Rent is included here even though the chart leaves it out. Newest day first; same-day order is kept.
  const categoryItems = useMemo(
    () =>
      categoryView
        ? items.filter((e) => e.category === categoryView).sort((a, b) => b.spentOn.localeCompare(a.spentOn))
        : [],
    [items, categoryView],
  );

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

    // Rent is reported on its own: it is left out of the monthly total, the category chart and the top category.
    const rentTotal = sum(items.filter(isRent));
    const spendItems = items.filter((e) => !isRent(e));
    const total = sum(spendItems);
    // Other lump sums (bills) stay in the total, but out of the per-day average and the pace.
    const fixedTotal = sum(spendItems.filter(isExcluded));
    const dailyTotal = total - fixedTotal;
    const avg = daysElapsed > 0 ? dailyTotal / daysElapsed : 0;

    const byCat: Record<string, number> = {};
    spendItems.forEach((e) => (byCat[e.category] = (byCat[e.category] ?? 0) + e.amount));
    const catData = Object.entries(byCat)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Rent is one huge bar that would squash every other day, and it is reported separately, so leave it out.
    const dayData = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, amount: 0 }));
    spendItems.forEach((e) => {
      const slot = dayData[dayOf(e) - 1];
      if (slot) slot.amount += e.amount;
    });

    // Compare like with like: for the current month, only the same days of last month.
    const prevComparable = sum(prevItems.filter((e) => !isRent(e) && (!isCurrent || dayOf(e) <= daysElapsed)));
    const deltaPct = prevComparable > 0 ? ((total - prevComparable) / prevComparable) * 100 : null;

    return {
      total,
      rentTotal,
      isCurrent,
      daysElapsed,
      avg,
      // Pace = what bills already cost + everyday spending continued at the current daily average (rent excluded).
      projected: isCurrent && spendItems.length > 0 ? fixedTotal + avg * daysInMonth : null,
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
    <div className={"page" + (view === "expenses" ? " is-calendar" : "")}>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="topbar-left">
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
        {!isMobile && (
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
        )}

        <main className={"content" + (loading ? " is-loading" : "")}>
          {!online && (
            <div className="banner offline" role="status">
              <strong>You’re offline.</strong> Spendly needs a connection to save or delete expenses, so Add expense is
              paused until you’re back online.
            </div>
          )}
          {error && online && (
            <div className="banner" role="alert">
              {error}
            </div>
          )}

          {view === "expenses" ? (
            <ExpenditureView
              items={items}
              month={month}
              today={today}
              loading={loading}
              onDelete={remove}
              onEdit={setEditing}
            />
          ) : (
            <div className="dash-grid">
              {!isMobile && (
                <section className="card add-card">
                  <h2 className="card-title">Add expense</h2>
                  <AddExpense defaultDate={today} onAdded={handleAdded} offline={!online} />
                </section>
              )}

              <section className="card kpi-card">
                <div className="hero">
                  <div className="hero-main">
                    <div className="eyebrow">
                      Spent in {monthLabel(month)} <span className="muted">· excl. rent</span>
                    </div>
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
                      <dd className="stat-note">excl. rent &amp; bills</dd>
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
                            <CategoryIcon name={stats.top} width={16} height={16} className="cat-glyph" />
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
                      <CategoryBreakdown
                        data={stats.catData}
                        total={stats.total}
                        loading={loading && !(month in byMonth)}
                        onSelect={setCategoryView}
                      />
                    </div>
                    {stats.rentTotal > 0 && (
                      <button
                        type="button"
                        className="rent-note"
                        style={{ "--dot": categoryColor(RENT_CATEGORY) } as CSSProperties}
                        aria-label={`Rent was ${inr(stats.rentTotal)}, not included above. View rent expenses`}
                        onClick={() => setCategoryView(RENT_CATEGORY)}
                      >
                        <CategoryIcon name={RENT_CATEGORY} width={16} height={16} className="cat-glyph" />
                        <span>Rent was</span>
                        <strong>{inr(stats.rentTotal)}</strong>
                        <span className="muted">· not included above</span>
                        <ChevronRightIcon width={16} height={16} />
                      </button>
                    )}
                  </div>
                  <div className="sub">
                    <h2 className="card-title">
                      Daily spend <span className="muted">· excl. rent</span>
                      {stats.avg > 0 && (
                        <span className="chart-legend" title="Daily average, excluding rent and bills">
                          <i className="avg-swatch" aria-hidden="true" />
                          Avg {inr(Math.round(stats.avg))}
                        </span>
                      )}
                    </h2>
                    <div className="sub-body fill">
                      <DailyChart
                        data={stats.dayData}
                        monthShort={shortMonth(month)}
                        average={stats.avg}
                        todayDay={stats.isCurrent ? Number(today.slice(8, 10)) : null}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <div className="recent">
                {recentDays.map((d) => (
                  <DayCard
                    key={d.date}
                    title={d.title}
                    subtitle={shortDate(d.date)}
                    items={d.items}
                    onDelete={remove}
                    onEdit={setEditing}
                  />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {isMobile && (
        <>
          <nav className="tabbar" aria-label="Main">
            <button
              type="button"
              className={"tab" + (view === "dashboard" ? " active" : "")}
              aria-current={view === "dashboard" ? "page" : undefined}
              onClick={() => goTo("dashboard")}
            >
              <LayoutIcon />
              <span>Dashboard</span>
            </button>
            <button
              type="button"
              className="tab-add"
              aria-label={online ? "Add expense" : "Add expense (unavailable while offline)"}
              title={online ? undefined : "You’re offline"}
              disabled={!online}
              onClick={() => setAddOpen(true)}
            >
              <PlusIcon width={26} height={26} />
            </button>
            <button
              type="button"
              className={"tab" + (view === "expenses" ? " active" : "")}
              aria-current={view === "expenses" ? "page" : undefined}
              onClick={() => goTo("expenses")}
            >
              <CalendarIcon />
              <span>Calendar</span>
            </button>
          </nav>

          {addOpen && (
            <>
              <div className="sheet-backdrop" onClick={() => setAddOpen(false)} />
              <div className="sheet" role="dialog" aria-label="Add expense">
                <span className="sheet-grab" />
                <div className="sheet-head">
                  <h2>Add expense</h2>
                  <button type="button" className="icon-btn" aria-label="Close" onClick={() => setAddOpen(false)}>
                    <CloseIcon />
                  </button>
                </div>
                <AddExpense defaultDate={today} onAdded={handleAdded} autoFocus offline={!online} />
              </div>
            </>
          )}
        </>
      )}

      {categoryView && (
        <CategoryDetail
          category={categoryView}
          month={month}
          today={today}
          items={categoryItems}
          isMobile={isMobile}
          suspendKeys={!!editing}
          onClose={closeCategory}
          onEdit={setEditing}
          onDelete={remove}
        />
      )}

      {editing && (
        <EditExpense
          expense={editing}
          isMobile={isMobile}
          offline={!online}
          onClose={closeEdit}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
