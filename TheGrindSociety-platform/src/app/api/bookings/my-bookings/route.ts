import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';

export async function GET() {
  const auth = await requireRole(['client', 'trainer', 'admin']);
  if ('error' in auth) return auth.error;

  if (auth.role === 'client') {
    const bookings = await prisma.trainerBooking.findMany({
      where: { clientId: auth.userId },
      include: {
        trainer: { include: { user: { select: { name: true } } } },
        service: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(bookings);
  }
  // trainer
  const profile = await prisma.trainerProfile.findUnique({ where: { userId: auth.userId } });
  if (!profile) return NextResponse.json([]);
  const bookings = await prisma.trainerBooking.findMany({
    where: { trainerId: profile.id },
    include: { client: { select: { name: true, email: true } }, service: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(bookings);
}
