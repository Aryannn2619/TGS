import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';

export async function GET(req: NextRequest) {
  const auth = await requireRole(['client', 'trainer', 'admin']);
  if ('error' in auth) return auth.error;
  const { searchParams } = new URL(req.url);
  const days = Math.min(365, parseInt(searchParams.get('days') || '90', 10));
  const since = new Date(Date.now() - days * 86400000);
  const measurements = await prisma.bodyMeasurement.findMany({
    where: { userId: auth.userId, date: { gte: since } },
    orderBy: { date: 'asc' },
  });
  return NextResponse.json(measurements);
}
