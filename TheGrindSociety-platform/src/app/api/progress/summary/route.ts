import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { progressScore, scoreLabel } from '@/lib/progress';

export async function GET() {
  const auth = await requireRole(['client', 'trainer', 'admin']);
  if ('error' in auth) return auth.error;

  const since7 = new Date(Date.now() - 7 * 86400000);
  const since30 = new Date(Date.now() - 30 * 86400000);

  const [measurements, dailyLogs, workoutsLast7, prsRecent, fitness] = await Promise.all([
    prisma.bodyMeasurement.findMany({ where: { userId: auth.userId }, orderBy: { date: 'desc' }, take: 60 }),
    prisma.progressLog.findMany({ where: { userId: auth.userId, date: { gte: since7 } } }),
    prisma.workoutLog.count({ where: { userId: auth.userId, workoutDate: { gte: since7 } } }),
    prisma.personalRecord.count({ where: { userId: auth.userId, date: { gte: since30 } } }),
    prisma.fitnessProfile.findUnique({ where: { userId: auth.userId } }),
  ]);

  const currentWeight = measurements[0]?.weight ?? null;
  const startingWeight = measurements[measurements.length - 1]?.weight ?? null;
  const weightChange = currentWeight != null && startingWeight != null ? currentWeight - startingWeight : null;

  const daysWithCalorieLog = new Set(dailyLogs.filter(d => d.caloriesConsumed != null).map(d => d.date.toISOString().slice(0, 10))).size;
  const sleepLogs = dailyLogs.map(d => d.sleepHours).filter((v): v is number => v != null);
  const avgSleep = sleepLogs.length ? sleepLogs.reduce((a, b) => a + b, 0) / sleepLogs.length : null;
  const stepsLogs = dailyLogs.map(d => d.steps).filter((v): v is number => v != null);
  const avgSteps = stepsLogs.length ? stepsLogs.reduce((a, b) => a + b, 0) / stepsLogs.length : null;
  const calLogs = dailyLogs.map(d => d.caloriesConsumed).filter((v): v is number => v != null);
  const avgCalories = calLogs.length ? calLogs.reduce((a, b) => a + b, 0) / calLogs.length : null;
  const proteinLogs = dailyLogs.map(d => d.proteinConsumed).filter((v): v is number => v != null);
  const avgProtein = proteinLogs.length ? proteinLogs.reduce((a, b) => a + b, 0) / proteinLogs.length : null;

  // Goal progress %: distance moved toward goal weight, capped 0-100. Only meaningful for fat-loss / muscle-gain.
  let goalProgressPct: number | null = null;
  if (fitness?.weight && currentWeight != null && startingWeight != null && startingWeight !== currentWeight) {
    // Treat fitness.weight as the original starting weight for now; goal is direction.
    if (fitness.goal === 'fat-loss' && weightChange != null && weightChange < 0) {
      goalProgressPct = Math.min(100, (Math.abs(weightChange) / 5) * 100); // 5kg = 100%
    } else if (fitness.goal === 'muscle-gain' && weightChange != null && weightChange > 0) {
      goalProgressPct = Math.min(100, (weightChange / 5) * 100);
    }
  }

  const score = progressScore({
    workoutsLast7,
    daysWithCalorieLog,
    avgSleepHours: avgSleep,
    avgSteps,
    goalProgressPct,
    recentPRs: prsRecent,
  });

  // Streak: count consecutive recent days with workoutCompleted=true (most recent first)
  const recentDailyLogs = await prisma.progressLog.findMany({
    where: { userId: auth.userId },
    orderBy: { date: 'desc' },
    take: 90,
  });
  let streak = 0;
  let cursor = new Date(); cursor.setHours(0, 0, 0, 0);
  for (const d of recentDailyLogs) {
    const dDay = new Date(d.date); dDay.setHours(0, 0, 0, 0);
    if (dDay.getTime() === cursor.getTime() && d.workoutCompleted) {
      streak++;
      cursor = new Date(cursor.getTime() - 86400000);
    } else if (dDay.getTime() < cursor.getTime()) {
      break;
    }
  }

  // Heatmap: last 30 days, on/off if a workout was logged
  const since30Iso = since30.toISOString();
  const heatmapWorkouts = await prisma.workoutLog.findMany({
    where: { userId: auth.userId, workoutDate: { gte: new Date(since30Iso) } },
    select: { workoutDate: true },
  });
  const workoutDays = new Set(heatmapWorkouts.map(w => w.workoutDate.toISOString().slice(0, 10)));
  const heatmap = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10);
    return { date: d, active: workoutDays.has(d) };
  });

  return NextResponse.json({
    overview: {
      currentWeight,
      startingWeight,
      goalWeight: null, // no field yet on fitness profile; UI prompts user
      weightChange,
      streak,
      totalWorkouts: workoutsLast7,
      avgCalories: avgCalories ? Math.round(avgCalories) : null,
      avgProtein: avgProtein ? Math.round(avgProtein) : null,
      avgSteps: avgSteps ? Math.round(avgSteps) : null,
      avgSleep: avgSleep ? Math.round(avgSleep * 10) / 10 : null,
      score,
      scoreLabel: scoreLabel(score),
    },
    weightTrend: measurements.filter(m => m.weight != null).reverse().map(m => ({
      date: m.date.toISOString().slice(0, 10),
      value: m.weight!,
    })),
    waistTrend: measurements.filter(m => m.waist != null).reverse().map(m => ({
      date: m.date.toISOString().slice(0, 10),
      value: m.waist!,
    })),
    heatmap,
    goal: fitness?.goal ?? null,
  });
}
