import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email and password" }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  const ok = user && (await bcrypt.compare(parsed.data.password, user.passwordHash));
  if (!user || !ok) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
