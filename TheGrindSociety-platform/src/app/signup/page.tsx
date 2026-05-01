'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'client' | 'trainer'>('client');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const r = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setErr(j.error?.formErrors?.[0] || j.error || 'Signup failed.');
      setLoading(false);
      return;
    }
    const signed = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (signed?.error) { setErr('Account created but login failed.'); return; }
    router.push(role === 'trainer' ? '/trainer/apply' : '/client/dashboard');
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10">
      <form onSubmit={onSubmit} className="w-full max-w-sm card">
        <h1 className="text-2xl font-extrabold mb-1">Create account</h1>
        <p className="text-muted text-sm mb-6">Start your grind.</p>
        <label className="label">Name</label>
        <input className="input mt-1 mb-3" required value={name} onChange={e => setName(e.target.value)} />
        <label className="label">Email</label>
        <input className="input mt-1 mb-3" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
        <label className="label">Password (8+ chars)</label>
        <input className="input mt-1 mb-3" type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} />
        <label className="label">I am a…</label>
        <div className="flex gap-2 mt-1 mb-4">
          <button type="button" onClick={() => setRole('client')}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm ${role==='client'?'border-primary text-text bg-primary/10':'border-white/10 text-muted'}`}>Client</button>
          <button type="button" onClick={() => setRole('trainer')}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm ${role==='trainer'?'border-primary text-text bg-primary/10':'border-white/10 text-muted'}`}>Trainer</button>
        </div>
        {err && <p className="text-red-400 text-sm mb-3">{err}</p>}
        <button disabled={loading} className="btn-primary w-full">{loading ? 'Creating…' : 'Create account'}</button>
        <p className="text-muted text-sm mt-4 text-center">
          Already have an account? <Link href="/login" className="text-primary-soft">Login</Link>
        </p>
      </form>
    </main>
  );
}
