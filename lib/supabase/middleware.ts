import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const PUBLIC_ROUTES = ["/login"]

function copyAuthState(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie))
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = from.headers.get(header)
    if (value) to.headers.set(header, value)
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)

  if (!user && !isPublicRoute) {
    // Un Server Action viaja como POST con el header Next-Action. Si lo
    // redirigimos a /login, el fetch del cliente sigue el redirect y recibe
    // HTML, lo que provoca el error genérico "An unexpected response was
    // received from the server." sin mensaje útil. Respondemos 401 en
    // text/plain para que Next.js lance ese texto como error de la acción.
    if (request.headers.has("next-action")) {
      const response = new NextResponse(
        "Tu sesión ha expirado. Inicia sesión de nuevo para continuar.",
        { status: 401, headers: { "Content-Type": "text/plain" } }
      )
      copyAuthState(supabaseResponse, response)
      return response
    }

    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.search = ""
    const response = NextResponse.redirect(url)
    copyAuthState(supabaseResponse, response)
    return response
  }

  if (user && isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    url.search = ""
    const response = NextResponse.redirect(url)
    copyAuthState(supabaseResponse, response)
    return response
  }

  return supabaseResponse
}
