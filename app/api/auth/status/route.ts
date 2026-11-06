import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Lets the login page decide whether to offer "Create account".
export async function GET() {
  const hasUsers = (await prisma.user.count()) > 0;
  return NextResponse.json({
    hasUsers,
    canSignup: !hasUsers || process.env.ALLOW_SIGNUP === "true",
  });
}
