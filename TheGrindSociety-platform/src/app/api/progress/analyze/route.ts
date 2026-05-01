import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { analyzeProgress } from '@/lib/progress';
import { bmrMifflinStJeor, tdee, targetCalories, macros } from '@/lib/fitness';

// Heuristic analysis. Replace with real Claude API call in next milestone
// (will need a server-side ANTHROPIC_API_KEY; do not expose to client).
export async function POST() {
  const auth = await requireRole(['client', 'trainer', 'admin']);
  if ('error' in auth) return auth.error;

  const since14 = new Date(Date.now() - 14 * 86400000);
  const [user, fitness, measurements, dailyLogs, workoutsLast7] = await Promise.all([
    prisma.user.findUnique({ where: { id: auth.userId } }),
    prisma.fitnessProfile.findUnique({ where: { userId: auth.userId } }),
    prisma.bodyMeasurement.findMany({ where: { userId: auth.userId, date: { gte: since14 } }, orderBy: { date: 'desc' } }),
    prisma.progressLog.findMany({ where: { userId: auth.userId, date: { gte: since14 } } }),
    prisma.workoutLog.count({ where: { userId: auth.userId, workoutDate: { gte: new Date(Date.now() - 7 * 86400000) } } }),
  ]);

  const goalDir: 'down' | 'up' | 'maintain' =
    fitness?.goal === 'fat-loss' ? 'down' :
    fitness?.goal === 'muscle-gain' ? 'up' : 'maintain';

  const cal = dailyLogs.map(d => d.caloriesConsumed).filter((v): v is number => v != null);
  const avgCalories = cal.length ? cal.reduce((a, b) => a + b, 0) / cal.length : null;
  const protein = dailyLogs.map(d => d.proteinConsumed).filter((v): v is number => v != null);
  const avgProtein = protein.length ? protein.reduce((a, b) => a + b, 0) / protein.length : null;
  const steps = dailyLogs.map(d => d.steps).filter((v): v is number => v != null);
  const avgSteps = steps.length ? steps.reduce((a, b) => a + b, 0) / steps.length : null;

  let proteinTarget: number | null = null;
  if (fitness?.weight && fitness.height) {
    const age = user?.dateOfBirth ? Math.floor((Date.now() - user.dateOfBirth.getTime()) / 31557600000) : 28;
    const sex = (user?.gender === 'female' ? 'female' : 'male') as 'male' | 'female';
    const bmr = bmrMifflinStJeor({ sex, weightKg: fitness.weight, heightCm: fitness.height, ageYears: age });
    const t = tdee(bmr, fitness.activityLevel || 'light');
    const cals = targetCalories(t, fitness.goal || 'fat-loss');
    proteinTarget = macros({ calories: cals, weightKg: fitness.weight, goal: fitness.goal || 'fat-loss' }).proteinG;
  }

  const result = analyzeProgress({
    recentWeights: measurements.map(m => m.weight).filter((v): v is number => v != null),
    weightGoalDirection: goalDir,
    workoutsLast7,
    avgCalories,
    proteinTarget,
    avgProtein,
    avgSteps,
  });

  return NextResponse.json({
    analysis: result,
    inputs: { workoutsLast7, avgCalories, avgProtein, avgSteps, proteinTarget, goal: fitness?.goal ?? null },
  });
}
