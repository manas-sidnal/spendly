"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CATEGORIES, PAY_METHODS } from "@/lib/constants";

type Expense = {
  id: string;
  amount: number;
  category: string;
  payMethod: string | null;
  note: string | null;
  spentOn: string; // YYYY-MM-DD
};

const COLORS = ["#2f6fed", "#e8833a", "#2fa36b", "#9b59d0", "#d64f7a", "#1fa8c9", "#c9a227", "#6b7585", "#8d6e63", "#43a047"];

const inr = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
const pad = (n: number) => String(n).padStart(2, "0");
const dateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export default function Dashboard() {
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${pad(now.getMonth() + 1)}`);
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // form state
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [spentOn, setSpentOn] = useState(dateStr(now));
  const [payMethod, setPayMethod] = useState<string>(PAY_METHODS[0]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/expenses?month=${month}`);
    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }
    if (!res.ok) {
      setError("Could not load expenses");
      setLoading(false);
      return;
    }
    setItems(await res.json());
    setError("");
    setLoading(false);
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: parseFloat(amount), category, payMethod, note, spentOn }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save expense");
      return;
    }
    setAmount("");
    setNote("");
    // If the new expense falls in another month, jump there so it is visible.
    const newMonth = spentOn.slice(0, 7);
    if (newMonth !== month) setMonth(newMonth);
    else load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this expense?")) return;
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else setError("Could not delete expense");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const stats = useMemo(() => {
    const total = items.reduce((s, e) => s + e.amount, 0);
    const [y, m] = month.split("-").map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const isCurrent = y === now.getFullYear() && m === now.getMonth() + 1;
    const daysElapsed = isCurrent ? now.getDate() : daysInMonth;

    const byCat: Record<string, number> = {};
    items.forEach((e) => (byCat[e.category] = (byCat[e.category] ?? 0) + e.amount));
    const catData = Object.entries(byCat)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const dayData = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, amount: 0 }));
    items.forEach((e) => {
      dayData[Number(e.spentOn.slice(8, 10)) - 1].amount += e.amount;
    });

    return { total, avg: total / daysElapsed, top: catData[0]?.name ?? "–", catData, dayData };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, month]);

  return (
    <div className="wrap">
      <header className="top">
        <div>
          <h1>Spendly</h1>
          <div className="note">Your personal expense tracker</div>
        </div>
        <div>
          <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
          <button className="link" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <div className="card">
        <form className="fields" onSubmit={addExpense}>
          <label>
            Amount (₹)
            <input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </label>
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Date
            <input type="date" value={spentOn} onChange={(e) => setSpentOn(e.target.value)} required />
          </label>
          <label>
            Paid via
            <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
              {PAY_METHODS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            Note
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="optional" />
          </label>
          <button className="primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Add expense"}
          </button>
        </form>
        {error && <div className="error" style={{ marginTop: 8 }}>{error}</div>}
      </div>

      <div className="grid stats">
        <div className="card stat">
          <div className="label">Total this month</div>
          <div className="value">{inr(stats.total)}</div>
        </div>
        <div className="card stat">
          <div className="label">Transactions</div>
          <div className="value">{items.length}</div>
        </div>
        <div className="card stat">
          <div className="label">Avg per day</div>
          <div className="value">{inr(stats.avg)}</div>
        </div>
        <div className="card stat">
          <div className="label">Top category</div>
          <div className="value">{stats.top}</div>
        </div>
      </div>

      <div className="grid charts">
        <div className="card">
          <div className="chart-title">By category</div>
          <div className="chart-box">
            {stats.catData.length === 0 ? (
              <div className="empty">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.catData} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2}>
                    {stats.catData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => inr(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="note" style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px" }}>
            {stats.catData.map((c, i) => (
              <span key={c.name}>
                <span style={{ color: COLORS[i % COLORS.length] }}>●</span> {c.name} {inr(c.value)}
              </span>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="chart-title">Daily spend</div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.dayData}>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} width={48} />
                <Tooltip formatter={(v) => inr(Number(v))} labelFormatter={(d) => `Day ${d}`} />
                <Bar dataKey="amount" fill="#2f6fed" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Note</th>
              <th>Paid via</th>
              <th className="amt">Amount</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <tr key={e.id}>
                <td>{e.spentOn}</td>
                <td>
                  <span className="badge">{e.category}</span>
                </td>
                <td>{e.note}</td>
                <td>{e.payMethod}</td>
                <td className="amt">{inr(e.amount)}</td>
                <td>
                  <button className="link del" title="Delete" onClick={() => remove(e.id)}>
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && items.length === 0 && <div className="empty">No expenses this month yet.</div>}
      </div>
    </div>
  );
}
