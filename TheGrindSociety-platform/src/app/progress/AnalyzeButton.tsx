'use client';
import { useState } from 'react';

type Analysis = { goingWell: string[]; slowing: string[]; nextWeek: string[] };

export default function AnalyzeButton() {
  const [out, setOut] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    setBusy(true); setErr(null);
    const r = await fetch('/api/progress/analyze', { method: 'POST' });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setErr(j.error || 'Failed'); return; }
    setOut(j.analysis);
  }

  return (
    <div>
      <button onClick={go} disabled={busy} className="btn-primary text-sm">{busy ? 'Analyzing…' : 'Analyze my progress'}</button>
      {err && <p className="text-red-400 text-sm mt-2">{err}</p>}
      {out && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <Section title="Going well" color="text-accent" items={out.goingWell} />
          <Section title="What's slowing you" color="text-yellow-400" items={out.slowing} />
          <Section title="This week" color="text-primary-soft" items={out.nextWeek} />
        </div>
      )}
    </div>
  );
}

function Section({ title, color, items }: { title: string; color: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-white/5 p-3">
      <p className={`label ${color}`}>{title}</p>
      <ul className="mt-2 space-y-1.5 text-muted">
        {items.length === 0 ? <li className="text-xs">—</li> : items.map((s, i) => <li key={i}>• {s}</li>)}
      </ul>
    </div>
  );
}
