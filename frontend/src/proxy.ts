import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
    matcher: ['/dashboard/:path*', '/verify-account'],
};

export function proxy(request: NextRequest) {
    const sessionCookie = request.cookies.get('ssid')?.value;
    if (!sessionCookie) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('return_to', request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }
}
