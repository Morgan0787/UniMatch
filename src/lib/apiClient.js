import { supabase } from '@/lib/supabase'
import { normalizeUniversity } from '@/lib/normalizeUniversity.js'
import { loadUniversityCatalog } from '@/lib/catalogRepository.js'
import { toAuthUser } from '@/lib/authUser.js'
import { normalizeFeedbackPayload } from '@/lib/feedbackPayload.js'
import { normalizeEssayRequest, validateEssayResponse } from '@/lib/essayContract.js'

const TABLE_MAP = {
  University: import.meta.env.VITE_TABLE_UNIVERSITY || 'universities',
  StudentProfile: import.meta.env.VITE_TABLE_STUDENT_PROFILE || 'student_profiles',
  UserFeedback: import.meta.env.VITE_TABLE_USER_FEEDBACK || 'user_feedback',
}

const normalizeEntityResult = (entityName, data) => {
  if (entityName !== 'University') return data
  if (Array.isArray(data)) return data.map(normalizeUniversity)
  if (data && typeof data === 'object') return normalizeUniversity(data)
  return []
}

const applyFilters = (query, filters = {}) => {
  Object.entries(filters || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return

    if (Array.isArray(value)) {
      query.in(key, value)
      return
    }

    query.eq(key, value)
  })
}

const applySort = (query, sort) => {
  if (!sort) return
  const isDesc = sort.startsWith('-')
  const field = isDesc ? sort.slice(1) : sort
  query.order(field, { ascending: !isDesc })
}

const entityClient = (entityName) => {
  const table = TABLE_MAP[entityName] || entityName

  return {
    list: async (sort = null, limit = 1000) => {
      let query = supabase.from(table).select('*').limit(limit)
      applySort(query, sort)

      const { data, error } = await query
      if (error) throw error

      return normalizeEntityResult(entityName, data || [])
    },

    filter: async (filters = {}, sort = null, limit = 1000) => {
      let query = supabase.from(table).select('*').limit(limit)
      applyFilters(query, filters)
      applySort(query, sort)

      const { data, error } = await query
      if (error) throw error

      return normalizeEntityResult(entityName, data || [])
    },

    create: async (payload) => {
      const user = await auth.me().catch(() => null)
      if (entityName === 'UserFeedback') {
        const record = { ...normalizeFeedbackPayload(payload), created_by: user?.email || null }
        // Anonymous callers may insert, but cannot read feedback rows via RLS.
        const { error } = await supabase.from(table).insert(record)
        if (error) throw error
        return { submitted: true }
      }
      if (entityName === 'StudentProfile' && !user?.email) throw new Error('Not authenticated')
      const record = {
        ...payload,
        ...(user?.email ? { created_by: user.email } : {}),
      }

      const { data, error } = await supabase.from(table).insert(record).select().single()
      if (error) throw error

      return normalizeEntityResult(entityName, data)
    },

    update: async (id, payload) => {
      const record = { ...payload }
      if (entityName === 'StudentProfile' || entityName === 'UserFeedback') delete record.created_by
      const { data, error } = await supabase.from(table).update(record).eq('id', id).select().single()
      if (error) throw error

      return normalizeEntityResult(entityName, data)
    },

    delete: async (id) => {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
      return true
    },
  }
}

const auth = {
  me: async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) throw error
    if (!user) throw new Error('Not authenticated')

    return toAuthUser(user)
  },

  isAuthenticated: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return Boolean(session?.user)
  },

  logout: async (redirectTo = '/') => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    if (typeof window !== 'undefined') {
      window.location.assign(redirectTo)
    }
  },

  redirectToLogin: async (returnTo) => {
    const next = returnTo || window.location.href
    window.location.assign(`/Login?redirect_to=${encodeURIComponent(next)}`)
  },
}

const aiInvoke = async (payload) => {
  const fail = code => Object.assign(new Error(code === 'unavailable' ? 'AI service is temporarily unavailable' : code), { code })
  if (import.meta.env.VITE_AI_ENABLED !== 'true') throw fail('unavailable')
  let input
  try { input = normalizeEssayRequest(payload) } catch { throw fail('invalid_request') }
  const functionName = import.meta.env.VITE_LLM_FUNCTION_NAME || 'essay-checker'
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: input,
  })

  if (error) {
    let code = error.context?.status === 401 ? 'unauthorized' : 'unavailable'
    try {
      const response = await error.context?.json()
      if (['unauthorized', 'rate_limited', 'invalid_request', 'invalid_response', 'timeout'].includes(response?.error)) code = response.error
    } catch { /* Network/gateway failures have no application response body. */ }
    throw fail(code)
  }
  try { return validateEssayResponse(input.action, data?.result) }
  catch { throw fail('invalid_response') }
}

const ai = {
  invoke: aiInvoke,
}

export const apiClient = {
  auth,
  entities: {
    University: {
      ...entityClient('University'),
      listCatalog: async () => normalizeEntityResult('University', await loadUniversityCatalog(supabase, TABLE_MAP.University)),
    },
    StudentProfile: entityClient('StudentProfile'),
    UserFeedback: entityClient('UserFeedback'),
  },
  ai,
  appLogs: {
    logUserInApp: async () => true,
  },
}

export const authClient = apiClient.auth
export const entitiesClient = apiClient.entities
export const aiClient = apiClient.ai
