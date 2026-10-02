import { supabase } from '@/lib/supabase'

const TABLE_MAP = {
  University: import.meta.env.VITE_TABLE_UNIVERSITY || 'universities',
  StudentProfile: import.meta.env.VITE_TABLE_STUDENT_PROFILE || 'student_profiles',
  UserFeedback: import.meta.env.VITE_TABLE_USER_FEEDBACK || 'user_feedback',
}

const parseJsonString = (value) => {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (!trimmed) return value
  if (!['[', '{', '"'].includes(trimmed[0])) return value

  try {
    return JSON.parse(trimmed)
  } catch {
    return value
  }
}

const asArray = (value) => {
  const parsed = parseJsonString(value)
  if (Array.isArray(parsed)) return parsed
  if (typeof parsed === 'string') {
    return parsed
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

const asObject = (value) => {
  const parsed = parseJsonString(value)
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
}

const asNullableNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const normalized = typeof value === 'string' ? Number(value.replace(/,/g, '').trim()) : Number(value)
  return Number.isFinite(normalized) ? normalized : null
}

const asString = (value, fallback = '') => {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

const asBoolean = (value) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'yes'].includes(normalized)) return true
    if (['false', '0', 'no', ''].includes(normalized)) return false
  }
  if (typeof value === 'number') return value !== 0
  return Boolean(value)
}

const normalizeUniversity = (university) => {
  const row = university && typeof university === 'object' ? university : {}
  return {
    ...row,
    id: row.id ?? null,
    name: asString(row.name, 'Unknown university'),
    country: asString(row.country),
    city: asString(row.city),
    region: asString(row.region),
    language: asString(row.language),
    website: asString(row.website),
    image_url: asString(row.image_url),
    description: asString(row.description),
    application_deadline: asString(row.application_deadline),
    topikLevel: asString(row.topikLevel),
    degree_levels: asArray(row.degree_levels),
    notable_programs: asArray(row.notable_programs),
    preferred_languages: asArray(row.preferred_languages),
    // FIX (2026-07-26): these three used to fall back to 0 via an `asNumber(x, 0)`
    // helper, which made every US university with a NULL min_gpa show "GPA 0.0" and
    // every university with a NULL tuition_min show as "Free". Using
    // asNullableNumber preserves null so EstimatedField / the "Not published"
    // UI branch can do its job instead of a fake zero looking like real data.
    //
    // living_cost_estimate was the same defect with a different number: it used
    // `asNumber(x, 8000)`, so a NULL became the literal 8000 upstream and every
    // cost surface downstream had a real figure to print with no data behind it
    // (~1,944 College Scorecard rows). It now preserves null like the others,
    // which leaves `asNumber` with no call sites — deliberately not reinstated:
    // defaulting a missing field to a plausible number is the defect, not the fix.
    // Consumers must null-check both cost fields before doing arithmetic — see
    // hasCostData() in src/pages/Recommendations.jsx.
    tuition_min: asNullableNumber(row.tuition_min),
    tuition_max: asNullableNumber(row.tuition_max),
    living_cost_estimate: asNullableNumber(row.living_cost_estimate),
    min_gpa: asNullableNumber(row.min_gpa),
    required_ielts: asNullableNumber(row.required_ielts),
    international_students_percent: asNullableNumber(row.international_students_percent),
    scholarships_available: asBoolean(row.scholarships_available),
    campus_life: asObject(row.campus_life),
    admission_requirements: asObject(row.admission_requirements),
    international_support: asObject(row.international_support),
  }
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
      const record = {
        ...payload,
        ...(user?.email && !payload?.created_by ? { created_by: user.email } : {}),
      }

      const { data, error } = await supabase.from(table).insert(record).select().single()
      if (error) throw error

      return normalizeEntityResult(entityName, data)
    },

    update: async (id, payload) => {
      const { data, error } = await supabase.from(table).update(payload).eq('id', id).select().single()
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

    return {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name,
      role: user.user_metadata?.role,
      ...user.user_metadata,
    }
  },

  isAuthenticated: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return Boolean(session?.user)
  },

  logout: async (redirectTo = '/') => {
    await supabase.auth.signOut()
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
  const functionName = import.meta.env.VITE_LLM_FUNCTION_NAME || 'invoke-llm'
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: payload,
  })

  if (error) throw error
  if (typeof data === 'string') return data
  return data?.result || data?.text || JSON.stringify(data)
}

const ai = {
  invoke: aiInvoke,
}

export const apiClient = {
  auth,
  entities: {
    University: entityClient('University'),
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
