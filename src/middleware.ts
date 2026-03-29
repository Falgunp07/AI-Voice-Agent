import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // ── Admin Routes Protection ──
    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
    const isAdminLogin = request.nextUrl.pathname === '/admin/login';
    const hasAdminCookie = request.cookies.has('admin_auth');

    if (isAdminRoute) {
        if (!hasAdminCookie && !isAdminLogin) {
            const url = request.nextUrl.clone();
            url.pathname = '/admin/login';
            return NextResponse.redirect(url);
        }
        if (hasAdminCookie && isAdminLogin) {
            const url = request.nextUrl.clone();
            url.pathname = '/admin/ai-playground';
            return NextResponse.redirect(url);
        }
        return supabaseResponse;
    }

    // ── Merchant (Dashboard) Protection ──
    const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard');
    const isAuthPage = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup';

    if (isDashboardRoute && !user) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    if (isAuthPage && user) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}

export const config = {
    matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/signup'],
};
