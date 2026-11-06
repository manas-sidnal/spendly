/**
 * Tiny arithmetic evaluator for the amount field (no eval).
 * Supports + - * / ( ), decimals, unary minus, and x / × / ÷ as aliases.
 */

const normalize = (expr: string) =>
  expr
    .replace(/[\s,]/g, "")
    .replace(/[x×]/gi, "*")
    .replace(/÷/g, "/");

/** True when the text is an expression (has an operator beyond a leading sign), not a plain number. */
export function hasOperator(expr: string): boolean {
  return /[+\-*/()]/.test(normalize(expr).slice(1));
}

/** Evaluates the expression, rounded to 2 decimals. Returns null when it is invalid. */
export function evaluate(expr: string): number | null {
  const s = normalize(expr);
  if (!s) return null;
  let i = 0;

  function number(): number | null {
    const m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i));
    if (!m) return null;
    i += m[0].length;
    return parseFloat(m[0]);
  }

  function factor(): number | null {
    const c = s[i];
    if (c === "+" || c === "-") {
      i++;
      const v = factor();
      return v === null ? null : c === "-" ? -v : v;
    }
    if (c === "(") {
      i++;
      const v = expression();
      if (v === null || s[i] !== ")") return null;
      i++;
      return v;
    }
    return number();
  }

  function term(): number | null {
    let left = factor();
    while (left !== null && (s[i] === "*" || s[i] === "/")) {
      const op = s[i++];
      const right = factor();
      if (right === null) return null;
      if (op === "/" && right === 0) return null;
      left = op === "*" ? left * right : left / right;
    }
    return left;
  }

  function expression(): number | null {
    let left = term();
    while (left !== null && (s[i] === "+" || s[i] === "-")) {
      const op = s[i++];
      const right = term();
      if (right === null) return null;
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }

  const result = expression();
  if (result === null || i !== s.length || !Number.isFinite(result)) return null;
  return Math.round(result * 100) / 100;
}
