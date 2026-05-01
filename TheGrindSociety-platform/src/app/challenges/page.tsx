import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import Nav from '../components/Nav';

export const dynamic = 'force-dynamic';

export default async function ChallengesPage() {
  const challenges = await prisma.challenge.findMany({ where: { active: true }, orderBy: { createdAt: 'asc' } });
  return (
    <main className="min-h-screen">
      <Nav />
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Challenges</h1>
        <p className="text-muted mb-8">Pay once. Personalized plan + daily tasks for the full duration.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {challenges.map((c) => (
            <article key={c.id} className="rounded-2xl bg-card border border-white/5 overflow-hidden flex flex-col">
              <div className="h-48 bg-cover bg-center" style={{ backgroundImage: c.imageUrl ? `url(${c.imageUrl})` : undefined }} />
              <div className="p-5 flex flex-col gap-3 flex-1">
                <p className="label">{c.durationDays} days · {c.challengeType}</p>
                <h3 className="text-xl font-bold">{c.title}</h3>
                <p className="text-muted text-sm flex-1">{c.description}</p>
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-2xl font-extrabold">₹{(c.price / 100).toLocaleString('en-IN')}</span>
                  <Link href={`/challenges/${c.slug}`} className="btn-primary text-sm">View</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
