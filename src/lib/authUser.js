// Presentation metadata is user-editable. Never spread it into identity/roles.
export const toAuthUser = (user) => user ? ({
  id: user.id,
  email: user.email,
  full_name: typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : '',
  role: user.app_metadata?.role === 'admin' ? 'admin' : 'user',
}) : null
