import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { isMockMode, splitAmount, verifyRazorpaySignature } from '@/lib/razorpay';

const Body = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});

export async function POST(req: NextRequest) {
  const auth = await requireRole(['client', 'trainer', 'admin']);
  if ('error' in auth) return auth.error;
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;

  const payment = await prisma.payment.findUnique({ where: { razorpayOrderId } });
  if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  if (payment.userId !== auth.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (payment.paymentStatus === 'paid') {
    return NextResponse.json({ ok: true, alreadyPaid: true, payment });
  }

  // Signature verification — REQUIRED in real mode. Skipped in mock mode.
  if (!isMockMode()) {
    const ok = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!ok) {
      await prisma.payment.update({ where: { id: payment.id }, data: { paymentStatus: 'failed' } });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.payment.update({
      where: { id: payment.id },
      data: { paymentStatus: 'paid', razorpayPaymentId, razorpaySignature },
    });

    if (payment.paymentType === 'challenge' && payment.challengeId) {
      const challenge = await tx.challenge.findUnique({ where: { id: payment.challengeId } });
      const start = new Date();
      const end = challenge ? new Date(start.getTime() + challenge.durationDays * 86400000) : null;
      await tx.userChallenge.upsert({
        where: { userId_challengeId: { userId: payment.userId, challengeId: payment.challengeId } },
        update: { paymentStatus: 'paid', status: 'active', startDate: start, endDate: end ?? undefined },
        create: {
          userId: payment.userId,
          challengeId: payment.challengeId,
          paymentStatus: 'paid',
          status: 'active',
          startDate: start,
          endDate: end ?? undefined,
        },
      });
    }

    if (payment.paymentType === 'booking' && payment.bookingId) {
      const booking = await tx.trainerBooking.findUnique({ where: { id: payment.bookingId } });
      if (booking) {
        const { trainerShare, platformShare } = splitAmount(payment.amount);
        await tx.trainerBooking.update({
          where: { id: booking.id },
          data: {
            paymentStatus: 'paid',
            bookingStatus: 'active',
            amountPaid: payment.amount,
            trainerEarning: trainerShare,
            platformCommission: platformShare,
          },
        });
        await tx.trainerEarning.create({
          data: {
            trainerId: booking.trainerId,
            bookingId: booking.id,
            totalAmount: payment.amount,
            trainerShare,
            platformShare,
            payoutStatus: 'pending',
          },
        });
        await tx.trainerProfile.update({
          where: { id: booking.trainerId },
          data: { totalClients: { increment: 1 } },
        });
      }
    }
    return updated;
  });

  return NextResponse.json({ ok: true, payment: result });
}
