'use client';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

export default function Nav() {
  const { data: session, status } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const dashHref = role === 'admin' ? '/admin/dashboard' : role === 'trainer' ? '/trainer/dashboard' : '/client/dashboard';

  return (
    <header className="flex items-center justify-between p-6 border-b border-white/5">
      <Link href="/" className="text-xl font-extrabold tracking-tight">TheGrindSociety</Link>
      <nav className="flex items-center gap-5 text-sm">
        <Link href="/challenges" className="text-muted hover:text-text">Challenges</Link>
        <Link href="/trainers" className="text-muted hover:text-text">Trainers</Link>
        {status === 'authenticated' && (
          <Link href="/progress" className="text-muted hover:text-text">Progress</Link>
        )}
        {status === 'authenticated' ? (
          <>
            <Link href={dashHref} className="text-muted hover:text-text">Dashboard</Link>
            <button onClick={() => signOut({ callbackUrl: '/' })} className="btn-ghost">Sign out</button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-muted hover:text-text">Login</Link>
            <Link href="/signup" className="btn-primary">Sign up</Link>
          </>
        )}
      </nav>
    </header>
  );
}
