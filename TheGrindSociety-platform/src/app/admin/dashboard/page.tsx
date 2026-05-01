import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/rbac';
import Nav from '../../components/Nav';
import ApproveButtons from './ApproveButtons';

export const dynamic = 'force-dynamic';

const fmt = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

export default async function AdminDashboard() {
  const me = await getSessionUser();
  if (!me) redirect('/login?next=/admin/dashboard');
  if (me.role !== 'admin') redirect('/');

  const [users, trainers, activeBookings, revenueAgg, commissionAgg, pendingPayoutAgg, pendingTrainers] = await Promise.all([
    prisma.user.count(),
    prisma.trainerProfile.count({ where: { verificationStatus: 'approved' } }),
    prisma.trainerBooking.count({ where: { bookingStatus: 'active' } }),
    prisma.payment.aggregate({ where: { paymentStatus: 'paid' }, _sum: { amount: true } }),
    prisma.trainerEarning.aggregate({ _sum: { platformShare: true } }),
    prisma.trainerEarning.aggregate({ where: { payoutStatus: { in: ['pending', 'requested'] } }, _sum: { trainerShare: true } }),
    prisma.trainerProfile.findMany({
      where: { verificationStatus: { in: ['pending', 'under_review'] } },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <main className="min-h-screen">
      <Nav />
      <section className="max-w-6xl mx-auto px-6 py-10">
        <p className="label">Admin</p>
        <h1 className="text-3xl font-extrabold">Platform Overview</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="card"><p className="label">Total users</p><p className="text-2xl font-extrabold mt-2">{users}</p></div>
          <div className="card"><p className="label">Approved trainers</p><p className="text-2xl font-extrabold mt-2">{trainers}</p></div>
          <div className="card"><p className="label">Active bookings</p><p className="text-2xl font-extrabold mt-2">{activeBookings}</p></div>
          <div className="card"><p className="label">Total revenue</p><p className="text-2xl font-extrabold mt-2">{fmt(revenueAgg._sum.amount ?? 0)}</p></div>
          <div className="card"><p className="label">Platform earnings (30%)</p><p className="text-2xl font-extrabold mt-2 text-accent">{fmt(commissionAgg._sum.platformShare ?? 0)}</p></div>
          <div className="card"><p className="label">Pending payouts</p><p className="text-2xl font-extrabold mt-2">{fmt(pendingPayoutAgg._sum.trainerShare ?? 0)}</p></div>
        </div>

        <div className="card mt-8">
          <h2 className="font-bold mb-3">Trainer applications ({pendingTrainers.length})</h2>
          {pendingTrainers.length === 0 ? (
            <p className="text-muted text-sm">No pending applications.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {pendingTrainers.map(t => (
                <li key={t.id} className="py-4 flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-xl">
                    <p className="font-semibold">{t.user.name} <span className="text-muted text-xs">· {t.user.email}</span></p>
                    <p className="text-muted text-xs mt-1">{t.specialization} · {t.experienceYears}y · {t.location ?? '—'}</p>
                    <p className="text-sm mt-2">{t.bio}</p>
                    <p className="text-xs text-muted mt-1">Certs: {t.certifications ?? '—'} · status: {t.verificationStatus}</p>
                  </div>
                  <ApproveButtons trainerId={t.id} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
