import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { expenseSchema, serialize } from "@/lib/expense";

// PATCH /api/expenses/[id]: the edit form sends the whole expense, validated exactly like POST.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = expenseSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const d = parsed.data;
  const { id } = await params;

  // updateMany with userId guarantees you can only change your own rows (someone else's id looks like "not found").
  const result = await prisma.expense.updateMany({
    where: { id, userId },
    data: {
      amount: d.amount,
      category: d.category,
      payMethod: d.payMethod ?? null,
      note: d.note?.trim() || null,
      spentOn: new Date(`${d.spentOn}T00:00:00Z`),
    },
  });
  if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const row = await prisma.expense.findFirst({ where: { id, userId } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(serialize(row));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  // deleteMany with userId guarantees you can only delete your own rows
  const result = await prisma.expense.deleteMany({ where: { id, userId } });
  if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
