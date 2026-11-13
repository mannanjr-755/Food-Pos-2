/**
 * A standalone POS signs its own login tokens, so the signing secret must never fall
 * back to a value an outsider could guess. Development keeps a fixed secret for
 * convenience; production refuses to boot without one.
 */
export const assertJwtSecret = () => {
  if (process.env.JWT_SECRET) return
  if (process.env.NODE_ENV === 'production') {
    console.error('JWT_SECRET is not set. Refusing to start: tokens would be forgeable.')
    process.exit(1)
  }
  console.warn('JWT_SECRET is not set — using a development-only signing secret.')
}

export const jwtSecret = () => process.env.JWT_SECRET || 'dev-only-insecure-secret'
