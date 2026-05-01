'use client';
import { useEffect, useState } from 'react';
import Nav from '../../components/Nav';

type Photo = { id: string; photoUrl: string; angle: string; visibility: string; uploadedAt: string };

export default function ProgressPhotos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [url, setUrl] = useState('');
  const [angle, setAngle] = useState<'front' | 'side' | 'back'>('front');
  const [visibility, setVisibility] = useState<'private' | 'trainer' | 'leaderboard'>('private');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await fetch('/api/progress/photos');
    if (r.ok) setPhotos(await r.json());
  }
  useEffect(() => { load(); }, []);

  async function upload(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setBusy(true);
    const r = await fetch('/api/progress/photo', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoUrl: url, angle, visibility }),
    });
    setBusy(false);
    if (!r.ok) { const j = await r.json().catch(()=>({})); setErr(JSON.stringify(j.error) || 'Failed'); return; }
    setUrl('');
    await load();
  }

  const grouped: Record<string, Photo[]> = { front: [], side: [], back: [] };
  for (const p of photos) (grouped[p.angle] ?? grouped.front).push(p);

  return (
    <main className="min-h-screen">
      <Nav />
      <section className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-extrabold mb-1">Progress photos</h1>
        <p className="text-muted text-sm mb-6">📸 Same lighting, same pose, same time of day for accurate comparison.</p>

        <form onSubmit={upload} className="card grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="label">Photo URL</label>
            <input className="input mt-1" required type="url" placeholder="https://… (Cloudinary upload coming next)" value={url} onChange={e => setUrl(e.target.value)} />
          </div>
          <div>
            <label className="label">Angle</label>
            <select className="input mt-1" value={angle} onChange={e => setAngle(e.target.value as 'front' | 'side' | 'back')}>
              <option value="front">Front</option><option value="side">Side</option><option value="back">Back</option>
            </select>
          </div>
          <div>
            <label className="label">Visibility</label>
            <select className="input mt-1" value={visibility} onChange={e => setVisibility(e.target.value as 'private' | 'trainer' | 'leaderboard')}>
              <option value="private">Private</option><option value="trainer">Trainer</option><option value="leaderboard">Leaderboard</option>
            </select>
          </div>
          {err && <p className="text-red-400 text-sm md:col-span-4">{err}</p>}
          <button disabled={busy} className="btn-primary md:col-span-4">{busy ? 'Uploading…' : 'Upload photo'}</button>
        </form>

        {(['front', 'side', 'back'] as const).map((a) => (
          <div key={a} className="mt-8">
            <h2 className="font-bold capitalize">{a} ({grouped[a].length})</h2>
            {grouped[a].length === 0 ? (
              <p className="text-muted text-sm mt-2">No photos yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-3">
                {grouped[a].map(p => (
                  <div key={p.id} className="rounded-xl overflow-hidden bg-card border border-white/5">
                    <div className="aspect-square bg-cover bg-center" style={{ backgroundImage: `url(${p.photoUrl})` }} />
                    <div className="p-2 flex justify-between text-xs text-muted">
                      <span>{new Date(p.uploadedAt).toISOString().slice(0,10)}</span>
                      <span>{p.visibility}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <p className="text-muted text-xs mt-10 italic">
          Disclaimer: progress tracking is for fitness guidance only and does not replace medical advice.
        </p>
      </section>
    </main>
  );
}
