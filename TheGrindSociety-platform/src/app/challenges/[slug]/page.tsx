import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Nav from '../../components/Nav';
import JoinButton from './JoinButton';

export const dynamic = 'force-dynamic';

export default async function ChallengeDetail({ params }: { params: { slug: string } }) {
  const challenge = await prisma.challenge.findUnique({ where: { slug: params.slug } });
  if (!challenge || !challenge.active) notFound();

  return (
    <main className="min-h-screen">
      <Nav />
      <section className="max-w-4xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-8">
        <div className="rounded-2xl overflow-hidden bg-card h-80 bg-cover bg-center" style={{ backgroundImage: challenge.imageUrl ? `url(${challenge.imageUrl})` : undefined }} />
        <div>
          <p className="label">{challenge.durationDays} days · {challenge.challengeType}</p>
          <h1 className="text-3xl font-extrabold mt-2">{challenge.title}</h1>
          <p className="text-muted mt-4">{challenge.description}</p>
          <ul className="mt-6 space-y-2 text-sm text-muted">
            <li>✓ Personalized calorie + macro targets (Mifflin-St Jeor)</li>
            <li>✓ Daily checklist: workout, protein, steps, water, mindset</li>
            <li>✓ Streak counter + completion %</li>
            <li>✓ Weekly check-ins to recalibrate</li>
            <li>✓ Progress photo tracking</li>
          </ul>
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
            <span className="text-3xl font-extrabold">₹{(challenge.price / 100).toLocaleString('en-IN')}</span>
            <JoinButton challengeId={challenge.id} />
          </div>
        </div>
      </section>
    </main>
  );
}
