import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { expenseSchema, serialize } from "@/lib/expense";

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
