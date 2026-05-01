import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@thegrindsociety.com';
  const adminPwd = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, name: 'Platform Admin', passwordHash: adminPwd, role: 'admin' },
  });

  const trainerPwd = await bcrypt.hash('trainer123', 10);
  const trainerUser = await prisma.user.upsert({
    where: { email: 'aarav@thegrindsociety.com' },
    update: {},
    create: {
      email: 'aarav@thegrindsociety.com',
      name: 'Aarav Khanna',
      passwordHash: trainerPwd,
      role: 'trainer',
    },
  });

  const trainer = await prisma.trainerProfile.upsert({
    where: { userId: trainerUser.id },
    update: {},
    create: {
      userId: trainerUser.id,
      bio: 'Former national-level powerlifter. 8 years coaching busy professionals to fat-loss + lean muscle.',
      specialization: 'fat-loss,hypertrophy',
      experienceYears: 8,
      certifications: 'NSCA-CPT, ISSA',
      verificationStatus: 'approved',
      interviewStatus: 'completed',
      rating: 4.9,
      location: 'Mumbai',
      basePrice: 149900,
      onlineAvailable: true,
      offlineAvailable: true,
    },
  });

  await prisma.trainerService.upsert({
    where: { id: `seed-${trainer.id}-online` },
    update: {},
    create: {
      id: `seed-${trainer.id}-online`,
      trainerId: trainer.id,
      serviceName: 'Online coaching · 4 weeks',
      serviceType: 'online-coaching',
      description: 'Workout + diet, weekly check-ins, WhatsApp access.',
      price: 149900,
      durationDays: 28,
    },
  });

  const challenges = [
    {
      slug: 'fat-loss-90',
      title: 'Lose 10kg in 3 Months',
      description:
        'Daily calorie target, 4-day workout split, step goals, mindset task. Weekly check-ins adjust calories and intensity as you progress.',
      durationDays: 90,
      price: 100000,
      challengeType: 'fat-loss',
      imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&q=80',
    },
    {
      slug: 'transform-45',
      title: '45 Days Transformation',
      description:
        'Strength + HIIT mix, slight deficit, weekly progress photos. Built for visible change in six weeks.',
      durationDays: 45,
      price: 100000,
      challengeType: 'transformation',
      imageUrl: 'https://images.unsplash.com/photo-1532384748853-8f54a8f476e2?w=900&q=80',
    },
    {
      slug: 'master-lifting',
      title: 'Master Weight Training',
      description:
        'Push/pull/legs split, form guides, progressive overload tracker, training science. Walk out able to write your own program.',
      durationDays: 84,
      price: 300000,
      challengeType: 'strength',
      imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=900&q=80',
    },
  ];
  for (const c of challenges) {
    await prisma.challenge.upsert({ where: { slug: c.slug }, update: c, create: c });
  }

  console.log('Seed complete: admin + 1 trainer + 3 challenges.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
