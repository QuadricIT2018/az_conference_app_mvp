import {
  STATIC_USER,
  STATIC_TOKEN,
  STATIC_PROFILE,
  STATIC_PUBLISHED_EVENTS,
  STATIC_EVENT,
  STATIC_DAYS,
  STATIC_DEPARTMENTS,
  STATIC_UPDATES,
  STATIC_SESSIONS,
  INITIAL_FAVOURITE_IDS,
} from './static-data'

// In-memory favourites set (persisted to localStorage for session persistence)
function loadFavourites(): Set<number> {
  try {
    const saved = localStorage.getItem('demo_favourites')
    if (saved) return new Set(JSON.parse(saved))
  } catch { /* ignore */ }
  return new Set(INITIAL_FAVOURITE_IDS)
}

const favouriteIds = loadFavourites()

function saveFavourites() {
  localStorage.setItem('demo_favourites', JSON.stringify([...favouriteIds]))
}

// Helper to build a successful axios-like response
function ok(data: unknown) {
  return Promise.resolve({ data: { success: true, data }, status: 200 })
}

// Mock API that matches all the routes the frontend uses
const api = {
  get(url: string) {
    // GET /auth/me
    if (url === '/auth/me') {
      return ok(STATIC_USER)
    }

    // GET /app/events (list)
    if (url === '/app/events') {
      return ok(STATIC_PUBLISHED_EVENTS)
    }

    // GET /app/events/:slug
    if (/^\/app\/events\/[^/]+$/.test(url)) {
      return ok(STATIC_EVENT)
    }

    // GET /app/events/:slug/days
    if (/\/days$/.test(url)) {
      return ok(STATIC_DAYS)
    }

    // GET /app/events/:slug/sessions?date=...
    if (/\/sessions\?/.test(url)) {
      const dateMatch = url.match(/date=([^&]+)/)
      const date = dateMatch ? dateMatch[1] : null
      const sessions = date
        ? STATIC_SESSIONS.filter((s) => s.session_date === date)
        : STATIC_SESSIONS
      // Stamp is_favourite from in-memory set
      const stamped = sessions.map((s) => ({ ...s, is_favourite: favouriteIds.has(s.id) }))
      return ok(stamped)
    }

    // GET /app/events/:slug/sessions (no query)
    if (/\/sessions$/.test(url)) {
      const stamped = STATIC_SESSIONS.map((s) => ({ ...s, is_favourite: favouriteIds.has(s.id) }))
      return ok(stamped)
    }

    // GET /app/events/:slug/updates
    if (/\/updates$/.test(url)) {
      return ok(STATIC_UPDATES)
    }

    // GET /app/favourites
    if (url === '/app/favourites') {
      const favSessions = STATIC_SESSIONS
        .filter((s) => favouriteIds.has(s.id))
        .map((s) => ({
          id: s.id,
          session_name: s.session_name,
          session_description: s.session_description,
          session_date: s.session_date,
          session_start_time: s.session_start_time,
          session_end_time: s.session_end_time,
          session_tag: s.session_tag,
          session_location: s.session_location,
          timezone: s.timezone,
          department: s.department,
          event_slug: s.event_slug,
          event_name: s.event_name,
        }))
      return ok(favSessions)
    }

    // GET /app/departments
    if (url === '/app/departments') {
      return ok(STATIC_DEPARTMENTS)
    }

    // GET /app/profile
    if (url === '/app/profile') {
      return ok(STATIC_PROFILE)
    }

    console.warn('[mock-api] Unhandled GET:', url)
    return ok(null)
  },

  post(url: string, data?: unknown) {
    // POST /auth/login
    if (url === '/auth/login') {
      return ok({ token: STATIC_TOKEN, user: STATIC_USER })
    }

    // POST /app/favourites/:id
    const favAddMatch = url.match(/^\/app\/favourites\/(\d+)$/)
    if (favAddMatch) {
      favouriteIds.add(Number(favAddMatch[1]))
      saveFavourites()
      return ok({ message: 'Added' })
    }

    console.warn('[mock-api] Unhandled POST:', url, data)
    return ok(null)
  },

  delete(url: string) {
    // DELETE /app/favourites/:id
    const favDelMatch = url.match(/^\/app\/favourites\/(\d+)$/)
    if (favDelMatch) {
      favouriteIds.delete(Number(favDelMatch[1]))
      saveFavourites()
      return ok({ message: 'Removed' })
    }

    console.warn('[mock-api] Unhandled DELETE:', url)
    return ok(null)
  },

  patch(url: string, data?: unknown) {
    // PATCH /app/profile
    if (url === '/app/profile') {
      return ok({ ...STATIC_PROFILE, ...(data as Record<string, unknown>) })
    }

    console.warn('[mock-api] Unhandled PATCH:', url, data)
    return ok(null)
  },

  put(url: string, data?: unknown) {
    console.warn('[mock-api] Unhandled PUT:', url, data)
    return ok(null)
  },

  // Support interceptors shape so existing code doesn't break
  interceptors: {
    request: { use: () => {} },
    response: { use: () => {} },
  },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default api as any
