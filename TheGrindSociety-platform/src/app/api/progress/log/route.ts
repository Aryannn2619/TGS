import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';

const Body = z.object({
  date: z.string().datetime().optional(),
  weight: z.number().min(30).max(300).optional(),
  bodyFat: z.number().min(2).max(60).optional(),
  chest: z.number().min(40).max(180).optional(),
  waist: z.number().min(40).max(200).optional(),
  hips: z.number().min(40).max(200).optional(),
  arms: z.number().min(15).max(80).optional(),
  thighs: z.number().min(20).max(120).optional(),
  shoulders: z.number().min(50).max(180).optional(),
  neck: z.number().min(20).max(80).optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireRole(['client', 'trainer', 'admin']);
  if ('error' in auth) return auth.error;
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const log = await prisma.bodyMeasurement.create({
    data: { ...parsed.data, userId: auth.userId, date: parsed.data.date ? new Date(parsed.data.date) : new Date() },
  });
  return NextResponse.json(log);
}
