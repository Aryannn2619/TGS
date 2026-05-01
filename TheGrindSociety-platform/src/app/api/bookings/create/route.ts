import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';

const Body = z.object({
  trainerId: z.string(),
  serviceId: z.string(),
  startDate: z.string().datetime().optional(),
  sessionTime: z.string().max(50).optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireRole(['client', 'trainer', 'admin']);
  if ('error' in auth) return auth.error;
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const service = await prisma.trainerService.findFirst({
    where: { id: parsed.data.serviceId, trainerId: parsed.data.trainerId, active: true },
  });
  if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });

  const start = parsed.data.startDate ? new Date(parsed.data.startDate) : new Date();
  const end = new Date(start.getTime() + service.durationDays * 24 * 60 * 60 * 1000);

  const booking = await prisma.trainerBooking.create({
    data: {
      clientId: auth.userId,
      trainerId: parsed.data.trainerId,
      serviceId: service.id,
      startDate: start,
      endDate: end,
      sessionTime: parsed.data.sessionTime,
      amountPaid: service.price, // updated again on payment verify
      bookingStatus: 'pending',
      paymentStatus: 'pending',
    },
  });
  return NextResponse.json(booking);
}
