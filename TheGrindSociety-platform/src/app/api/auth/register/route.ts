import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const Body = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(128),
  role: z.enum(['client', 'trainer']).default('client'),
});

export async function POST(req: NextRequest) {
  let json;
  try { json = await req.json(); } catch { return NextResponse.json({ error: 'Bad JSON' }, { status: 400 }); }
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name, email, password, role } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, passwordHash, role } });

  if (role === 'trainer') {
    await prisma.trainerProfile.create({
      data: { userId: user.id, verificationStatus: 'pending', interviewStatus: 'pending' },
    });
  }
  return NextResponse.json({ id: user.id, email: user.email, role: user.role });
}
