import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Redirect root to /store
    if (pathname === '/') {
        return NextResponse.redirect(new URL('/store', request.url))
    }

    // Allow all other paths to proceed
    return NextResponse.next()
}

export const config = {
    matcher: ['/'],
}