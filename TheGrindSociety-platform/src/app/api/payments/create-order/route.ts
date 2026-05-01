import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { getRazorpay, isMockMode } from '@/lib/razorpay';

const Body = z.object({
  paymentType: z.enum(['challenge', 'booking', 'plan']),
  challengeId: z.string().optional(),
  bookingId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireRole(['client', 'trainer', 'admin']);
  if ('error' in auth) return auth.error;
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  let amount = 0;
  if (parsed.data.paymentType === 'challenge') {
    if (!parsed.data.challengeId) return NextResponse.json({ error: 'challengeId required' }, { status: 400 });
    const ch = await prisma.challenge.findUnique({ where: { id: parsed.data.challengeId } });
    if (!ch) return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    amount = ch.price;
  } else if (parsed.data.paymentType === 'booking') {
    if (!parsed.data.bookingId) return NextResponse.json({ error: 'bookingId required' }, { status: 400 });
    const b = await prisma.trainerBooking.findUnique({ where: { id: parsed.data.bookingId } });
    if (!b) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (b.clientId !== auth.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    amount = b.amountPaid;
  } else {
    return NextResponse.json({ error: 'Plan payments not implemented' }, { status: 400 });
  }

  const rzp = getRazorpay();
  let orderId: string;
  if (rzp) {
    const order = await rzp.orders.create({
      amount,
      currency: 'INR',
      receipt: crypto.randomUUID(),
    });
    orderId = order.id;
  } else {
    orderId = `order_mock_${crypto.randomBytes(8).toString('hex')}`;
  }

  const payment = await prisma.payment.create({
    data: {
      userId: auth.userId,
      challengeId: parsed.data.challengeId,
      bookingId: parsed.data.bookingId,
      amount,
      paymentType: parsed.data.paymentType,
      paymentStatus: 'created',
      razorpayOrderId: orderId,
    },
  });

  return NextResponse.json({
    orderId,
    amount,
    currency: 'INR',
    paymentDbId: payment.id,
    razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || null,
    mockMode: isMockMode(),
  });
}
