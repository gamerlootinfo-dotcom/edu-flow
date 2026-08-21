import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  const publicRoutes = ['/', '/auth/login', '/auth/register', '/tests']
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith('/tests/')
  )

  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    if (pathname.startsWith('/auth/')) {
      if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url))
      if (role === 'teacher') return NextResponse.redirect(new URL('/teacher', request.url))
      if (role === 'student') return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    if (pathname.startsWith('/teacher') && role !== 'teacher') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    const studentRoutes = ['/dashboard', '/exam', '/wallet', '/results']
    const isStudentRoute = studentRoutes.some(r => pathname.startsWith(r))
    if (isStudentRoute && role !== 'student') {
      if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url))
      if (role === 'teacher') return NextResponse.redirect(new URL('/teacher', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
