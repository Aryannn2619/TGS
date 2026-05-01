import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';

// Photo upload accepts a URL only for now (Cloudinary integration TODO).
// To wire uploads: have the client POST a multipart file to a separate
// /api/upload route that pushes to Cloudinary and returns the URL, then
// the client calls this endpoint with that URL.
const Body = z.object({
  photoUrl: z.string().url(),
  angle: z.enum(['front', 'side', 'back']),
  visibility: z.enum(['private', 'trainer', 'leaderboard']).default('private'),
});

export async function POST(req: NextRequest) {
  const auth = await requireRole(['client', 'trainer', 'admin']);
  if ('error' in auth) return auth.error;
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const photo = await prisma.progressPhoto.create({
    data: { ...parsed.data, userId: auth.userId },
  });
  return NextResponse.json(photo);
}
