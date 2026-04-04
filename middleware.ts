import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { getSupabaseAuthCookieOptions } from '@/lib/supabase/auth-cookie';
import { memberHasPremiumAccess } from '@/lib/member-entitlement';
import { getDashboardPath, normalizeRole } from '@/lib/role';

/** Copy Set-Cookie headers from the session refresh response onto a redirect (middleware must not drop refreshed tokens). */
function redirectWithSessionCookies(
  request: NextRequest,
  sessionResponse: NextResponse,
  toPath: string
) {
  const url = new URL(toPath, request.url);
  const redirectResponse = NextResponse.redirect(url);
  sessionResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });
  return redirectResponse;
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      ...getSupabaseAuthCookieOptions(),
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options });
          });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set({ name, value, ...options });
          });
        },
      },
    }
  ) as unknown as SupabaseClient<Database>;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  if (user) {
    if (process.env.NODE_ENV === 'development') {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log('MIDDLEWARE: User has session', session);
    }
  } else if (authError && process.env.NODE_ENV === 'development') {
    console.warn('[middleware] getUser:', authError.message);
  }

  if (!user) {
    // Send to sign-in with return path — avoids dumping people on marketing home with no way back.
    const next = `${pathname}${request.nextUrl.search ?? ''}`;
    const login = new URL('/login', request.url);
    login.searchParams.set('next', next);
    return redirectWithSessionCookies(request, response, `${login.pathname}${login.search}`);
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
    const qs = request.nextUrl.search;
    return redirectWithSessionCookies(request, response, `${dest}${qs}`);
  }

  if (pathname.startsWith('/admin') || pathname.startsWith('/mentor')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .single();

    const role = profile?.role ?? 'user';

    if (profile?.status === 'suspended') {
      return redirectWithSessionCookies(request, response, '/login?error=suspended');
    }
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return redirectWithSessionCookies(
        request,
        response,
        getDashboardPath(normalizeRole(role))
      );
    }
    if (pathname.startsWith('/mentor') && role !== 'mentor' && role !== 'admin') {
      return redirectWithSessionCookies(
        request,
        response,
        getDashboardPath(normalizeRole(role))
      );
    }
  }

  /** Member-only premium areas: paid subscription (`active`) or one-time active purchase; overview `/user` stays open.
   *  `/user/quizzes` is not gated here so members can open the hub; quiz generation API enforces premium. */
  if (pathname.startsWith('/user')) {
    const gated =
      pathname.startsWith('/user/courses') ||
      pathname.startsWith('/user/materials') ||
      pathname.startsWith('/user/sessions');
    if (gated) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();

      const { data: subRows } = await supabase
        .from('subscriptions')
        .select('status, plan')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const sub = subRows?.[0];
      const latestSub = sub?.status ?? null;
      const latestPlan = sub?.plan ?? null;
      if (!memberHasPremiumAccess(profile, latestSub, latestPlan)) {
        return redirectWithSessionCookies(request, response, '/user/upgrade?locked=1');
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/admin/:path*',
    '/mentor/:path*',
    '/user',
    '/user/:path*',
  ],
};
