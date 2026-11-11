const HOME = '/'
const ORIGIN = 'https://unimatch.local'
export const LAST_PUBLIC_ROUTE_KEY = 'unimatch:last-public-route'

const PUBLIC_ROUTES = new Set(['/', '/home', '/search', '/ru/search', '/uz/search', '/admissionssurvey', '/university'])
const isPublicRoute = path => PUBLIC_ROUTES.has(path.toLowerCase()) || /^\/universities\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path)

/** Keep login return targets inside the app and out of the login route. */
export function safeLoginReturn(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return HOME
  }

  const path = value.split(/[?#]/, 1)[0]
  try {
    let decodedPath = path
    for (let attempt = 0; attempt < 16; attempt += 1) {
      if (decodedPath.startsWith('//') || decodedPath.includes('\\') || /^\/login\/?$/i.test(decodedPath)) return HOME
      const decodedURL = new URL(decodedPath, ORIGIN)
      if (decodedURL.origin !== ORIGIN || /^\/login\/?$/i.test(decodedURL.pathname)) return HOME
      const nextPath = decodeURIComponent(decodedPath)
      if (nextPath === decodedPath) break
      if (nextPath.startsWith('//') || nextPath.includes('\\')) return HOME
      decodedPath = nextPath
      if (attempt === 15) return HOME
    }

    const parsed = new URL(value, ORIGIN)
    if (parsed.origin !== ORIGIN || /^\/login\/?$/i.test(parsed.pathname)) return HOME
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return HOME
  }
}

/** Return a safe destination for guest cancellation, limited to public pages. */
export function safePublicLoginReturn(value) {
  const safeReturn = safeLoginReturn(value)
  try {
    const parsed = new URL(safeReturn, ORIGIN)
    return isPublicRoute(parsed.pathname) ? safeReturn : HOME
  } catch {
    return HOME
  }
}

/** Save only known public app routes; storage failures must not interrupt routing. */
export function rememberPublicRoute(location, storage) {
  const route = safePublicLoginReturn(`${location?.pathname ?? ''}${location?.search ?? ''}${location?.hash ?? ''}`)
  if (route === HOME && location?.pathname !== '/' && location?.pathname?.toLowerCase() !== '/home') return

  try {
    const targetStorage = storage ?? (typeof window !== 'undefined' ? window.sessionStorage : null)
    targetStorage?.setItem(LAST_PUBLIC_ROUTE_KEY, route)
  } catch {
    // Storage can be unavailable in private browsing; the Login fallback remains Home.
  }
}

export function readLastPublicRoute(storage) {
  try {
    const targetStorage = storage ?? (typeof window !== 'undefined' ? window.sessionStorage : null)
    return safePublicLoginReturn(targetStorage?.getItem(LAST_PUBLIC_ROUTE_KEY))
  } catch {
    return HOME
  }
}

export function loginCancelTarget(redirectTo, lastPublicRoute) {
  if (typeof redirectTo !== 'string' || !redirectTo) return safePublicLoginReturn(lastPublicRoute)
  const safeTarget = safeLoginReturn(redirectTo)
  const parsed = new URL(safeTarget, ORIGIN)
  if (safeTarget !== HOME && isPublicRoute(parsed.pathname)) return safePublicLoginReturn(safeTarget)
  if (safeTarget === HOME && redirectTo === '/') return HOME
  return safePublicLoginReturn(lastPublicRoute)
}
