import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';

export async function GET() {
  const auth = await requireRole(['client', 'trainer', 'admin']);
  if ('error' in auth) return auth.error;
  const payments = await prisma.payment.findMany({
    where: { userId: auth.userId },
    orderBy: { createdAt: 'desc' },
    include: { challenge: { select: { title: true, slug: true } } },
  });
  return NextResponse.json(payments);
}
