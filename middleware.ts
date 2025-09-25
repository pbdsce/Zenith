import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const pathname = request.nextUrl.pathname

  // If the user is already on the home page, let them through
  if (pathname === '/') {
    return NextResponse.next()
  }

  // For all other routes, redirect to home page
  const homeUrl = new URL('/', request.url)
  return NextResponse.redirect(homeUrl)
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)'
  ]
}