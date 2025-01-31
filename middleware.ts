import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Liste des routes publiques qui ne nécessitent pas d'authentification
const publicRoutes = ['/login', '/signup', '/auth/callback', '/forgot-password']

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const requestUrl = new URL(request.url)
  const isPublicRoute = publicRoutes.some(route => requestUrl.pathname.startsWith(route))
  const isStaticAsset = requestUrl.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico)$/)
  const isNextAsset = requestUrl.pathname.startsWith('/_next')

  console.log(`🔒 Middleware - URL: ${requestUrl.pathname}`)
  console.log(`👤 Session: ${session ? 'Yes' : 'No'}`)

  // Allow access to static assets and Next.js internals
  if (isStaticAsset || isNextAsset) {
    console.log('✅ Middleware - Allowing access to asset')
    return res
  }

  // Allow access to public routes
  if (isPublicRoute) {
    console.log('✅ Middleware - Allowing access to public route')
    return res
  }

  // Protect all other routes
  if (!session) {
    console.log('🚫 Middleware - No user, redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  console.log('✅ Middleware - User authenticated, allowing access')
  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - auth/callback (auth callback route)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 