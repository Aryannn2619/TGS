'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ApproveButtons({ trainerId }: { trainerId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(action: 'approve' | 'reject') {
    setBusy(true);
    await fetch(`/api/admin/trainers/${trainerId}/${action}`, { method: 'PUT' });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button disabled={busy} onClick={() => act('approve')} className="rounded-full bg-accent text-bg font-semibold px-4 py-2 text-sm">Approve</button>
      <button disabled={busy} onClick={() => act('reject')} className="rounded-full border border-white/10 px-4 py-2 text-sm">Reject</button>
    </div>
  );
}
