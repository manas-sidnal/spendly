import { z } from "zod";
import { CATEGORIES, PAY_METHODS } from "@/lib/constants";

const isOneOf = (list: readonly string[]) => (value: string) => list.includes(value);

// Shared by POST /api/expenses and PATCH /api/expenses/[id]. (Route files can't export extras, so it lives here.)
export const expenseSchema = z.object({
  amount: z.number().positive().max(1_000_000_000),
  category: z.string().refine(isOneOf(CATEGORIES), { message: "Pick a valid category" }),
  payMethod: z.string().refine(isOneOf(PAY_METHODS), { message: "Pick a valid payment method" }).nullish(),
  note: z.string().max(500).nullish(),
  spentOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    // Rejects impossible dates like 2026-02-31 or 2026-13-45, which would otherwise fail inside Prisma (a 500).
    .refine(
      (s) => {
        const d = new Date(`${s}T00:00:00Z`);
        return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
      },
      { message: "Enter a valid date" },
    ),
});

export function serialize(e: {
  id: string;
  amount: unknown;
  category: string;
  payMethod: string | null;
  note: string | null;
  spentOn: Date;
}) {
  return {
    id: e.id,
    amount: Number(e.amount),
    category: e.category,
    payMethod: e.payMethod,
    note: e.note,
    spentOn: e.spentOn.toISOString().slice(0, 10),
  };
}
