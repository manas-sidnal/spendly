import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  // The very first account is always allowed; after that only if ALLOW_SIGNUP=true.
  const userCount = await prisma.user.count();
  if (userCount > 0 && process.env.ALLOW_SIGNUP !== "true") {
    return NextResponse.json({ error: "Sign-ups are disabled" }, { status: 403 });
  }

  const email = parsed.data.email.toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: { email, passwordHash: await bcrypt.hash(parsed.data.password, 12) },
  });
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
