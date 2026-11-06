"use client";

import { useRef, useState, type CSSProperties, type FormEvent } from "react";
import { CATEGORIES, PAY_METHODS, categoryColor } from "@/lib/constants";

export default function AddExpense({
  defaultDate,
  onAdded,
}: {
  defaultDate: string;
  onAdded: (month: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [spentOn, setSpentOn] = useState(defaultDate);
  const [payMethod, setPayMethod] = useState<string>(PAY_METHODS[0]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const amountRef = useRef<HTMLInputElement>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!(value > 0)) {
      setError("Enter an amount greater than zero");
      amountRef.current?.focus();
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value, category, payMethod, note, spentOn }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not save expense");
        return;
      }
      setAmount("");
      setNote("");
      amountRef.current?.focus();
      onAdded(spentOn.slice(0, 7));
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="add-form" onSubmit={submit}>
      <label className="amount-field">
        <span className="currency">₹</span>
        <input
          ref={amountRef}
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-label="Amount in rupees"
          required
        />
      </label>

      <div>
        <span className="field-label">Category</span>
        <div className="chips" role="radiogroup" aria-label="Category">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={category === c}
              className={"chip" + (category === c ? " active" : "")}
              style={{ "--dot": categoryColor(c) } as CSSProperties}
              onClick={() => setCategory(c)}
            >
              <span className="dot" />
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="field-label">Paid via</span>
        <div className="chips" role="radiogroup" aria-label="Payment method">
          {PAY_METHODS.map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={payMethod === p}
              className={"chip plain" + (payMethod === p ? " active" : "")}
              onClick={() => setPayMethod(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="row-2">
        <label>
          <span className="field-label">Date</span>
          <input className="input" type="date" value={spentOn} onChange={(e) => setSpentOn(e.target.value)} required />
        </label>
        <label>
          <span className="field-label">Note</span>
          <input
            className="input"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional"
            maxLength={500}
          />
        </label>
      </div>

      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}

      <button className="btn-primary" type="submit" disabled={saving}>
        {saving ? "Saving…" : "Add expense"}
      </button>
    </form>
  );
}
