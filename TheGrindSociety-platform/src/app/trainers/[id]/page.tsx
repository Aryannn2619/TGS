import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Nav from '../../components/Nav';
import HireButton from './HireButton';

export const dynamic = 'force-dynamic';

export default async function TrainerDetail({ params }: { params: { id: string } }) {
  const t = await prisma.trainerProfile.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true } },
      services: { where: { active: true } },
      reviews: { include: { client: { select: { name: true } } }, take: 5, orderBy: { createdAt: 'desc' } },
    },
  });
  if (!t || t.verificationStatus !== 'approved') notFound();

  return (
    <main className="min-h-screen">
      <Nav />
      <section className="max-w-4xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <p className="label">★ {t.rating.toFixed(1)} · {t.totalClients} clients · {t.experienceYears}y experience</p>
          <h1 className="text-3xl font-extrabold mt-2">{t.user.name}</h1>
          <p className="text-muted text-sm mt-1">{t.location} · {t.specialization}</p>
          <p className="text-muted mt-5">{t.bio}</p>
          <h2 className="text-xl font-bold mt-8 mb-3">Reviews</h2>
          {t.reviews.length === 0 && <p className="text-muted text-sm">No reviews yet.</p>}
          <ul className="space-y-3">
            {t.reviews.map(r => (
              <li key={r.id} className="card">
                <p className="text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)} <span className="text-muted">— {r.client.name}</span></p>
                <p className="text-sm text-muted mt-1">{r.reviewText}</p>
              </li>
            ))}
          </ul>
        </div>
        <aside>
          <h2 className="text-lg font-bold mb-3">Services</h2>
          <div className="space-y-3">
            {t.services.length === 0 && <p className="text-muted text-sm">No active services.</p>}
            {t.services.map(s => (
              <div key={s.id} className="card">
                <p className="label">{s.serviceType} · {s.durationDays}d</p>
                <p className="font-bold mt-1">{s.serviceName}</p>
                <p className="text-muted text-sm mt-1">{s.description}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                  <span className="font-bold">₹{(s.price / 100).toLocaleString('en-IN')}</span>
                  <HireButton trainerId={t.id} serviceId={s.id} />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
