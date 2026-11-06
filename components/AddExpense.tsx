"use client";

import { useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent } from "react";
import { evaluate, hasOperator } from "@/lib/calc";
import { CATEGORIES, PAY_METHODS, categoryColor } from "@/lib/constants";
import { inr } from "@/lib/format";

// Operator keys for phones, whose number pad has no + - × ÷. [label, text inserted]
const CALC_KEYS: [string, string][] = [
  ["+", "+"],
  ["−", "-"],
  ["×", "×"],
  ["÷", "÷"],
  ["(", "("],
  [")", ")"],
];

export default function AddExpense({
  defaultDate,
  onAdded,
  autoFocus = false,
  offline = false,
}: {
  defaultDate: string;
  onAdded: (month: string) => void;
  autoFocus?: boolean;
  offline?: boolean;
}) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [spentOn, setSpentOn] = useState(defaultDate);
  const [payMethod, setPayMethod] = useState<string>(PAY_METHODS[0]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const amountRef = useRef<HTMLInputElement>(null);

  // The amount field doubles as a calculator: "450+120*2" shows a live result, Enter fills it in.
  const isExpr = hasOperator(amount);
  const calcResult = isExpr ? evaluate(amount) : null;

  function insertKey(text: string) {
    const el = amountRef.current;
    const start = el?.selectionStart ?? amount.length;
    const end = el?.selectionEnd ?? start;
    setAmount(amount.slice(0, start) + text + amount.slice(end));
    setError("");
    requestAnimationFrame(() => el?.setSelectionRange(start + text.length, start + text.length));
  }

  function applyResult() {
    if (calcResult !== null) setAmount(String(calcResult));
    amountRef.current?.focus();
  }

  function onAmountKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" || !isExpr) return;
    e.preventDefault(); // calculate instead of submitting
    if (calcResult === null) {
      setError("Can't calculate that expression");
      return;
    }
    setError("");
    setAmount(String(calcResult));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (offline) return; // expenses are only saved on the server, never queued locally
    const value = evaluate(amount) ?? 0;
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
          type="text"
          inputMode="decimal"
          autoFocus={autoFocus}
          autoComplete="off"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9+\-*/().,xX×÷ ]/g, ""))}
          onKeyDown={onAmountKeyDown}
          aria-label="Amount in rupees (you can type a calculation, e.g. 450+120*2)"
          required
        />
      </label>
      <div className="calc-keys" role="group" aria-label="Calculator keys">
        {CALC_KEYS.map(([label, text]) => (
          <button
            key={label}
            type="button"
            className="calc-key"
            aria-label={text}
            onMouseDown={(e) => e.preventDefault()} // keep the amount field focused so the keyboard stays up
            onClick={() => insertKey(text)}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          className="calc-key equals"
          aria-label="Calculate"
          disabled={calcResult === null}
          onMouseDown={(e) => e.preventDefault()}
          onClick={applyResult}
        >
          =
        </button>
      </div>
      {isExpr && (
        <div className={"calc-hint" + (calcResult === null ? " invalid" : "")} aria-live="polite">
          {calcResult === null ? (
            "Not a valid calculation"
          ) : (
            <>
              = {inr(calcResult)}
              <span className="hint-desktop"> · press Enter to apply</span>
              <span className="hint-mobile"> · tap = to apply</span>
            </>
          )}
        </div>
      )}

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

      {offline && (
        <div className="form-note" id="add-offline-note">
          You’re offline, so this expense can’t be saved. Reconnect to add it.
        </div>
      )}

      <button
        className="btn-primary"
        type="submit"
        disabled={saving || offline}
        aria-describedby={offline ? "add-offline-note" : undefined}
      >
        {saving ? "Saving…" : offline ? "Offline" : "Add expense"}
      </button>
    </form>
  );
}
