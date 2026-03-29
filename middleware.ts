import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { memberHasPremiumAccess } from '@/lib/member-entitlement';
import { getDashboardPath, normalizeRole } from '@/lib/role';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Cast: @supabase/ssr generic arity differs from SupabaseClient<Database> in this dependency set.
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  ) as unknown as SupabaseClient<Database>;

  // Use getUser() (not getSession()): validates the JWT with Supabase Auth on each request.
  // Session refresh + cookie updates run as part of this flow via the cookie handlers above.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  /** Router hub: avoid RSC-only redirect loops / repeated fetches — send users straight to their home. */
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    const meta = user.user_metadata as { role?: string } | undefined;
    const role = normalizeRole(profile?.role ?? meta?.role);
    const dest = getDashboardPath(role);
    return NextResponse.redirect(new URL(dest, request.url));
  }

  if (pathname.startsWith('/admin') || pathname.startsWith('/mentor')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .single();

    const role = profile?.role ?? 'user';

    if (profile?.status === 'suspended') {
      return NextResponse.redirect(new URL('/login?error=suspended', request.url));
    }
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (pathname.startsWith('/mentor') && role !== 'mentor' && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  /** Member-only premium areas: paid subscription (`active`) or one-time active purchase; overview `/user` stays open. */
  if (pathname.startsWith('/user')) {
    const gated =
      pathname.startsWith('/user/courses') ||
      pathname.startsWith('/user/quizzes') ||
      pathname.startsWith('/user/materials') ||
      pathname.startsWith('/user/sessions');
    if (gated) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, signup_access_type, status, is_active')
        .eq('id', user.id)
        .single();

      const { data: subRows } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const latestSub = subRows?.[0]?.status ?? null;
      if (!memberHasPremiumAccess(profile, latestSub)) {
        return NextResponse.redirect(new URL('/user?locked=1', request.url));
      }
    }
  }

  return response;
}

export const config = {
  // Include bare `/dashboard` — some Next versions do not match `/dashboard/:path*` without a trailing segment.
  matcher: ['/dashboard', '/dashboard/:path*', '/admin/:path*', '/mentor/:path*', '/user/:path*'],
};
