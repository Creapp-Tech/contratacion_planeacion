import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const PUBLIC_ROUTES = ["/login"]

// Nombres de parámetros que jamás deben viajar por la URL. Si llegan, se
// descartan sin leer su valor y se limpia la barra de direcciones.
const PARAMS_CREDENCIALES = ["usuario", "password", "contrasena", "contraseña", "correo"]

function tieneParamsCredenciales(url: URL): boolean {
  return PARAMS_CREDENCIALES.some((param) => url.searchParams.has(param))
}

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
    error: userError,
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Seguridad: nunca se procesan credenciales enviadas por URL. Si la request
  // trae ?usuario=/&password=/etc., se ignora su valor y se redirige a la misma
  // ruta sin query string. No se registra el contenido de los parámetros.
  if (tieneParamsCredenciales(request.nextUrl)) {
    const url = request.nextUrl.clone()
    url.search = ""
    const response = NextResponse.redirect(url)
    copyAuthState(supabaseResponse, response)
    return response
  }

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)

  // Error transitorio al validar el token (red/5xx): NO forzamos logout ni
  // redirigimos a /login. Dejamos pasar la request; los componentes que sí
  // necesitan el usuario lo volverán a validar y mostrarán un error en
  // pantalla. Así una caída de red no expulsa al usuario de la app.
  if (userError && userError.status && userError.status >= 500) {
    return supabaseResponse
  }

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

  // Si el usuario ya está en /login con una sesión válida, lo enviamos a la
  // raíz. La raíz decide qué mostrar (dashboard o panel de error de perfil),
  // por lo que no se forma un bucle login <-> dashboard.
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
