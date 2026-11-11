const MAX_MESSAGE_LENGTH = 4000
const MAX_EMAIL_LENGTH = 254
const MAX_PAGE_PATH_LENGTH = 200

const FEEDBACK_TYPES = new Set([
  'Suggestion',
  'Bug / Problem',
  'General Feedback',
])

const APP_PATHS = new Set([
  '/',
  '/AdminDataQuality',
  '/AdminFeedback',
  '/AdmissionsSurvey',
  '/EssayChecker',
  '/Home',
  '/Login',
  '/Profile',
  '/Recommendations',
  '/Search',
  '/University',
])

function normalizePagePath(value) {
  if (typeof value !== 'string') return null

  const input = value.trim()
  if (!input) return null

  let path
  if (input.startsWith('/')) {
    path = input.split(/[?#]/, 1)[0]
  } else {
    // Read only the path portion of an absolute URL. Parsing the URL is not
    // required to safely drop query/hash data, including malformed suffixes.
    const schemeEnd = input.indexOf('://')
    if (!/^https?:\/\//i.test(input) || schemeEnd < 1) return null
    const authorityEnd = input.slice(schemeEnd + 3).search(/[/?#]/)
    if (authorityEnd < 0) {
      path = '/'
    } else {
      const pathStart = schemeEnd + 3 + authorityEnd
      const first = input[pathStart]
      path = first === '/' ? input.slice(pathStart).split(/[?#]/, 1)[0] : '/'
    }
  }

  if (path === '/ru/Search' || path === '/uz/Search') return '/Search'
  if (path.length > MAX_PAGE_PATH_LENGTH || !APP_PATHS.has(path)) return null
  return path
}

/**
 * Validate and minimize browser feedback before it crosses the API boundary.
 * Identity fields such as created_by are intentionally never copied through.
 *
 * @param {unknown} payload
 * @returns {{ feedback_type: string, message: string, email: string | null, page_url: string | null }}
 */
export function normalizeFeedbackPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new TypeError('Feedback payload must be an object')
  }
  const fields = /** @type {Record<string, unknown>} */ (payload)

  const feedbackType = typeof fields.feedback_type === 'string'
    ? fields.feedback_type.trim()
    : ''
  if (!FEEDBACK_TYPES.has(feedbackType)) {
    throw new TypeError('Unsupported feedback type')
  }

  const message = typeof fields.message === 'string' ? fields.message.trim() : ''
  if (message.length < 1 || message.length > MAX_MESSAGE_LENGTH) {
    throw new TypeError('Feedback message must contain 1 to 4000 characters')
  }

  const rawEmail = fields.email == null ? '' : fields.email
  if (typeof rawEmail !== 'string') throw new TypeError('Feedback email must be text')
  const email = rawEmail.trim()
  if (email.length > MAX_EMAIL_LENGTH || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    throw new TypeError('Feedback email is invalid')
  }

  return {
    feedback_type: feedbackType,
    message,
    email: email || null,
    page_url: normalizePagePath(fields.page_url),
  }
}

