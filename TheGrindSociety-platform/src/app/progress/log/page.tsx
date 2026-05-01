'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '../../components/Nav';

export default function BodyMeasurementLog() {
  const router = useRouter();
  const [f, setF] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    const body: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(f)) {
      if (v === '' || v == null) continue;
      if (k === 'notes') body[k] = v;
      else body[k] = Number(v);
    }
    const r = await fetch('/api/progress/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setBusy(false);
    if (!r.ok) { const j = await r.json().catch(()=>({})); setErr(JSON.stringify(j.error) || 'Failed'); return; }
    router.push('/progress');
    router.refresh();
  }

  const fields: { key: string; label: string; suffix: string }[] = [
    { key: 'weight', label: 'Weight', suffix: 'kg' },
    { key: 'bodyFat', label: 'Body fat %', suffix: '%' },
    { key: 'chest', label: 'Chest', suffix: 'cm' },
    { key: 'waist', label: 'Waist', suffix: 'cm' },
    { key: 'hips', label: 'Hips', suffix: 'cm' },
    { key: 'arms', label: 'Arms', suffix: 'cm' },
    { key: 'thighs', label: 'Thighs', suffix: 'cm' },
    { key: 'shoulders', label: 'Shoulders', suffix: 'cm' },
    { key: 'neck', label: 'Neck', suffix: 'cm' },
  ];

  return (
    <main className="min-h-screen">
      <Nav />
      <section className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-extrabold mb-2">Log body measurement</h1>
        <p className="text-muted text-sm mb-6">Fill what you measured today. Skip the rest.</p>
        <form onSubmit={submit} className="card grid grid-cols-2 md:grid-cols-3 gap-4">
          {fields.map(({ key, label, suffix }) => (
            <div key={key}>
              <label className="label">{label}</label>
              <div className="relative mt-1">
                <input type="number" step="0.1" className="input pr-10" value={f[key] ?? ''} onChange={e => setF({ ...f, [key]: e.target.value })} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">{suffix}</span>
              </div>
            </div>
          ))}
          <div className="col-span-full">
            <label className="label">Notes</label>
            <textarea className="input mt-1 min-h-20" value={f.notes ?? ''} onChange={e => setF({ ...f, notes: e.target.value })} />
          </div>
          {err && <p className="text-red-400 text-sm col-span-full">{err}</p>}
          <button disabled={busy} className="btn-primary col-span-full">{busy ? 'Saving…' : 'Save measurement'}</button>
        </form>
      </section>
    </main>
  );
}
