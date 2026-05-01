import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/rbac';
import Nav from '../components/Nav';
import LineChart from '../components/LineChart';
import { progressScore, scoreLabel } from '@/lib/progress';
import AnalyzeButton from './AnalyzeButton';

export const dynamic = 'force-dynamic';

export default async function ProgressPage() {
  const me = await getSessionUser();
  if (!me) redirect('/login?next=/progress');

  const since7 = new Date(Date.now() - 7 * 86400000);
  const since30 = new Date(Date.now() - 30 * 86400000);

  const [measurements, dailyLogs, photos, workoutsLast7, prsRecent, fitness, prCount] = await Promise.all([
    prisma.bodyMeasurement.findMany({ where: { userId: me.id }, orderBy: { date: 'asc' } }),
    prisma.progressLog.findMany({ where: { userId: me.id, date: { gte: since7 } } }),
    prisma.progressPhoto.findMany({ where: { userId: me.id }, orderBy: { uploadedAt: 'desc' }, take: 6 }),
    prisma.workoutLog.count({ where: { userId: me.id, workoutDate: { gte: since7 } } }),
    prisma.personalRecord.count({ where: { userId: me.id, date: { gte: since30 } } }),
    prisma.fitnessProfile.findUnique({ where: { userId: me.id } }),
    prisma.personalRecord.count({ where: { userId: me.id } }),
  ]);

  const sorted = [...measurements].sort((a, b) => a.date.getTime() - b.date.getTime());
  const latest = sorted[sorted.length - 1];
  const first = sorted[0];

  const cal = dailyLogs.map(d => d.caloriesConsumed).filter((v): v is number => v != null);
  const avgCalories = cal.length ? cal.reduce((a, b) => a + b, 0) / cal.length : null;
  const protein = dailyLogs.map(d => d.proteinConsumed).filter((v): v is number => v != null);
  const avgProtein = protein.length ? protein.reduce((a, b) => a + b, 0) / protein.length : null;
  const steps = dailyLogs.map(d => d.steps).filter((v): v is number => v != null);
  const avgSteps = steps.length ? steps.reduce((a, b) => a + b, 0) / steps.length : null;
  const sleep = dailyLogs.map(d => d.sleepHours).filter((v): v is number => v != null);
  const avgSleep = sleep.length ? sleep.reduce((a, b) => a + b, 0) / sleep.length : null;

  const daysWithCalorieLog = new Set(dailyLogs.filter(d => d.caloriesConsumed != null).map(d => d.date.toISOString().slice(0, 10))).size;

  let goalProgressPct: number | null = null;
  if (first && latest && first.weight && latest.weight && first.weight !== latest.weight) {
    const change = latest.weight - first.weight;
    if (fitness?.goal === 'fat-loss' && change < 0) goalProgressPct = Math.min(100, (Math.abs(change) / 5) * 100);
    else if (fitness?.goal === 'muscle-gain' && change > 0) goalProgressPct = Math.min(100, (change / 5) * 100);
  }

  const score = progressScore({
    workoutsLast7,
    daysWithCalorieLog,
    avgSleepHours: avgSleep,
    avgSteps,
    goalProgressPct,
    recentPRs: prsRecent,
  });

  // Heatmap: last 30 days workout activity
  const heatmapWorkouts = await prisma.workoutLog.findMany({
    where: { userId: me.id, workoutDate: { gte: since30 } },
    select: { workoutDate: true },
  });
  const workoutDays = new Set(heatmapWorkouts.map(w => w.workoutDate.toISOString().slice(0, 10)));
  const heatmap = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10);
    return { date: d, active: workoutDays.has(d) };
  });

  const weightSeries = sorted.filter(m => m.weight != null).map((m, i) => ({
    x: i, y: m.weight!, label: `${m.date.toISOString().slice(0, 10)} · ${m.weight}kg`,
  }));
  const waistSeries = sorted.filter(m => m.waist != null).map((m, i) => ({
    x: i, y: m.waist!, label: `${m.date.toISOString().slice(0, 10)} · ${m.waist}cm`,
  }));

  return (
    <main className="min-h-screen">
      <Nav />
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="label">Progress Tracker</p>
            <h1 className="text-3xl font-extrabold">Are you actually improving?</h1>
            <p className="text-muted text-sm mt-1">Body, workouts, consistency, strength — one place.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/progress/log" className="btn-primary text-sm">Log measurement</Link>
            <Link href="/progress/photos" className="btn-ghost text-sm">Photos</Link>
            <Link href="/workout/log" className="btn-ghost text-sm">Log workout</Link>
            <Link href="/workout/progress" className="btn-ghost text-sm">Workout progress →</Link>
          </div>
        </div>

        {/* Score ring + overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-8">
          <div className="card flex items-center gap-5">
            <ScoreRing value={score} />
            <div>
              <p className="label">Progress Score</p>
              <p className="text-2xl font-extrabold">{score}/100</p>
              <p className="text-muted text-sm">{scoreLabel(score)}</p>
            </div>
          </div>
          <div className="card lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Current weight" value={latest?.weight != null ? `${latest.weight} kg` : '—'} />
            <Stat label="Starting" value={first?.weight != null ? `${first.weight} kg` : '—'} />
            <Stat label="Change" value={
              latest?.weight != null && first?.weight != null && latest.weight !== first.weight
                ? `${(latest.weight - first.weight).toFixed(1)} kg`
                : '—'
            } accent={
              latest?.weight != null && first?.weight != null
                ? (fitness?.goal === 'fat-loss' ? (latest.weight < first.weight ? 'good' : 'bad') :
                   fitness?.goal === 'muscle-gain' ? (latest.weight > first.weight ? 'good' : 'bad') : null)
                : null
            } />
            <Stat label="Workouts (7d)" value={workoutsLast7.toString()} />
            <Stat label="Avg calories" value={avgCalories ? Math.round(avgCalories).toString() : '—'} />
            <Stat label="Avg protein" value={avgProtein ? `${Math.round(avgProtein)} g` : '—'} />
            <Stat label="Avg steps" value={avgSteps ? Math.round(avgSteps).toLocaleString() : '—'} />
            <Stat label="Avg sleep" value={avgSleep ? `${avgSleep.toFixed(1)} h` : '—'} />
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
          <div className="card">
            <p className="label">Weight trend</p>
            <div className="mt-3">
              <LineChart points={weightSeries} color="#4F46E5" fill="rgba(79,70,229,0.15)" yLabel="kg" />
            </div>
          </div>
          <div className="card">
            <p className="label">Waist reduction</p>
            <div className="mt-3">
              <LineChart points={waistSeries} color="#22C55E" fill="rgba(34,197,94,0.15)" yLabel="cm" />
            </div>
          </div>
        </div>

        {/* Consistency heatmap */}
        <div className="card mt-6">
          <div className="flex items-center justify-between">
            <p className="label">Last 30 days · workout activity</p>
            <p className="text-xs text-muted">{heatmap.filter(d => d.active).length} active days · {prCount} total PRs</p>
          </div>
          <div className="grid grid-cols-15 mt-3 gap-1.5" style={{ gridTemplateColumns: 'repeat(30, minmax(0, 1fr))' }}>
            {heatmap.map((d) => (
              <div key={d.date} title={`${d.date}${d.active ? ' · workout' : ''}`}
                className={`aspect-square rounded ${d.active ? 'bg-accent' : 'bg-white/5'}`} />
            ))}
          </div>
        </div>

        {/* Photos preview */}
        <div className="card mt-6">
          <div className="flex items-center justify-between">
            <p className="label">Progress photos</p>
            <Link href="/progress/photos" className="text-primary-soft text-sm">See all →</Link>
          </div>
          {photos.length === 0 ? (
            <p className="text-muted text-sm mt-2">No photos yet. <Link href="/progress/photos" className="text-primary-soft">Upload first photo →</Link></p>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mt-3">
              {photos.map(p => (
                <div key={p.id} className="aspect-square rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${p.photoUrl})` }} title={`${p.angle} · ${p.uploadedAt.toISOString().slice(0,10)}`} />
              ))}
            </div>
          )}
        </div>

        {/* Analyze */}
        <div className="card mt-6">
          <p className="label">Analyze My Progress</p>
          <p className="text-muted text-sm mt-1 mb-3">Heuristic analysis based on your last 14 days. (Real AI analysis coming next.)</p>
          <AnalyzeButton />
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: 'good' | 'bad' | null }) {
  const cls = accent === 'good' ? 'text-accent' : accent === 'bad' ? 'text-red-400' : '';
  return (
    <div>
      <p className="label">{label}</p>
      <p className={`text-xl font-bold mt-1 ${cls}`}>{value}</p>
    </div>
  );
}

function ScoreRing({ value }: { value: number }) {
  const r = 38, c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <svg width={92} height={92} viewBox="0 0 92 92">
      <circle cx={46} cy={46} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={8} fill="none" />
      <circle cx={46} cy={46} r={r} stroke="#22C55E" strokeWidth={8} fill="none"
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 46 46)" />
      <text x={46} y={50} textAnchor="middle" fontSize="22" fontWeight={800} fill="#E5E7EB">{value}</text>
    </svg>
  );
}
