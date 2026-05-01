import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';

export async function GET() {
  const auth = await requireRole(['client', 'trainer', 'admin']);
  if ('error' in auth) return auth.error;
  const photos = await prisma.progressPhoto.findMany({
    where: { userId: auth.userId },
    orderBy: { uploadedAt: 'desc' },
  });
  return NextResponse.json(photos);
}
