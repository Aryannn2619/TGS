import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import Nav from '../components/Nav';

export const dynamic = 'force-dynamic';

export default async function TrainersPage() {
  const trainers = await prisma.trainerProfile.findMany({
    where: { verificationStatus: 'approved' },
    include: { user: { select: { name: true, profileImage: true } } },
    orderBy: [{ rating: 'desc' }, { totalClients: 'desc' }],
    take: 24,
  });
  return (
    <main className="min-h-screen">
      <Nav />
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Hire a Trainer</h1>
        <p className="text-muted mb-8">Verified coaches. 70% of every booking goes to your trainer.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {trainers.map((t) => (
            <Link key={t.id} href={`/trainers/${t.id}`} className="rounded-2xl bg-card border border-white/5 p-5 block hover:border-primary/40 transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold">{t.user.name?.[0] ?? 'T'}</div>
                <div>
                  <p className="font-bold">{t.user.name}</p>
                  <p className="text-xs text-muted">{t.location ?? '—'} · ★ {t.rating.toFixed(1)}</p>
                </div>
              </div>
              <p className="text-sm text-muted mb-3 line-clamp-2">{t.bio ?? 'Verified coach'}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">{t.specialization?.split(',').slice(0,2).join(' · ')}</span>
                <span className="font-bold">₹{(t.basePrice / 100).toLocaleString('en-IN')}</span>
              </div>
            </Link>
          ))}
          {trainers.length === 0 && (
            <p className="text-muted col-span-full">No approved trainers yet. Apply via signup → trainer.</p>
          )}
        </div>
      </section>
    </main>
  );
}
