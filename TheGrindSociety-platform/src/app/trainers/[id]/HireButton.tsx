'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

declare global {
  interface Window { Razorpay?: new (opts: Record<string, unknown>) => { open: () => void } }
}

export default function HireButton({ trainerId, serviceId }: { trainerId: string; serviceId: string }) {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function start() {
    setErr(null);
    if (status !== 'authenticated') {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setLoading(true);

    const b = await fetch('/api/bookings/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trainerId, serviceId }),
    });
    const booking = await b.json();
    if (!b.ok) { setErr(booking.error || 'Booking failed'); setLoading(false); return; }

    const o = await fetch('/api/payments/create-order', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentType: 'booking', bookingId: booking.id }),
    });
    const order = await o.json();
    if (!o.ok) { setErr(order.error || 'Order failed'); setLoading(false); return; }

    if (order.mockMode) {
      const v = await fetch('/api/payments/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpayOrderId: order.orderId,
          razorpayPaymentId: `pay_mock_${Math.random().toString(16).slice(2, 18)}`,
          razorpaySignature: 'mock',
        }),
      });
      if (!v.ok) { const j = await v.json().catch(()=>({})); setErr(j.error || 'Verification failed'); setLoading(false); return; }
      router.push('/client/dashboard');
      return;
    }

    if (!window.Razorpay) await loadScript('https://checkout.razorpay.com/v1/checkout.js');
    const rzp = new window.Razorpay!({
      key: order.razorpayKeyId,
      amount: order.amount,
      currency: order.currency,
      name: 'TheGrindSociety',
      order_id: order.orderId,
      handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        const v = await fetch('/api/payments/verify', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpayOrderId: resp.razorpay_order_id,
            razorpayPaymentId: resp.razorpay_payment_id,
            razorpaySignature: resp.razorpay_signature,
          }),
        });
        if (v.ok) router.push('/client/dashboard'); else setErr('Verification failed');
      },
      theme: { color: '#4F46E5' },
    });
    rzp.open();
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button onClick={start} disabled={loading} className="btn-primary text-sm">{loading ? 'Working…' : 'Hire'}</button>
      {err && <p className="text-red-400 text-xs">{err}</p>}
    </div>
  );
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.onload = () => resolve(); s.onerror = () => reject(new Error('script load failed'));
    document.head.appendChild(s);
  });
}
