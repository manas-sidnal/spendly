import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";

const expenseSchema = z.object({
  amount: z.number().positive().max(1_000_000_000),
  category: z.string().min(1).max(50),
  payMethod: z.string().max(50).nullish(),
  note: z.string().max(500).nullish(),
  spentOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
});

function serialize(e: {
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

// GET /api/expenses?month=YYYY-MM
export async function GET(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const month = new URL(req.url).searchParams.get("month");
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "month=YYYY-MM is required" }, { status: 400 });
  }
  const [y, m] = month.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));

  const rows = await prisma.expense.findMany({
    where: { userId, spentOn: { gte: start, lt: end } },
    orderBy: [{ spentOn: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(rows.map(serialize));
}

// POST /api/expenses
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = expenseSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const d = parsed.data;
  const row = await prisma.expense.create({
    data: {
      userId,
      amount: d.amount,
      category: d.category,
      payMethod: d.payMethod ?? null,
      note: d.note?.trim() || null,
      spentOn: new Date(`${d.spentOn}T00:00:00Z`),
    },
  });
  return NextResponse.json(serialize(row), { status: 201 });
}
