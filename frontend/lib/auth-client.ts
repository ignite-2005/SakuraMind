export type Session = { email: string }

export type UserRecord = {
  email: string
  passwordHash: string
}

const USERS_KEY = "sakuramind_users_v1"
const SESSION_KEY = "sakuramind_session_v1"
const TRANSIENT_SESSION_KEY = "sakuramind_session_tmp_v1"

function loadUsers(): UserRecord[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as UserRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveUsers(users: UserRecord[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder().encode(password)
  const buf = await crypto.subtle.digest("SHA-256", enc)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null
  try {
    const transientRaw = sessionStorage.getItem(TRANSIENT_SESSION_KEY)
    if (transientRaw) {
      const transient = JSON.parse(transientRaw) as Session
      if (transient && typeof transient.email === "string") {
        return { email: transient.email }
      }
    }

    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Session
    if (s && typeof s.email === "string") return { email: s.email }
    return null
  } catch {
    return null
  }
}

export function setSession(session: Session | null, remember = true) {
  if (typeof window === "undefined") return
  if (!session) {
    localStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(TRANSIENT_SESSION_KEY)
    return
  }

  if (remember) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    sessionStorage.removeItem(TRANSIENT_SESSION_KEY)
    return
  }

  sessionStorage.setItem(TRANSIENT_SESSION_KEY, JSON.stringify(session))
  localStorage.removeItem(SESSION_KEY)
}

export async function registerUser(
  email: string,
  password: string,
): Promise<string | null> {
  const normalized = email.trim().toLowerCase()
  if (!normalized || !password) return "Email and password are required."
  if (password.length < 6) return "Password must be at least 6 characters."

  const users = loadUsers()
  if (users.some((u) => u.email === normalized)) {
    return "An account with this email already exists."
  }

  const passwordHash = await hashPassword(password)
  users.push({ email: normalized, passwordHash })
  saveUsers(users)
  return null
}

export async function loginUser(
  email: string,
  password: string,
  remember = true,
): Promise<{ error: string } | { session: Session }> {
  const normalized = email.trim().toLowerCase()
  const users = loadUsers()
  const user = users.find((u) => u.email === normalized)
  if (!user) return { error: "Invalid email or password." }

  const hash = await hashPassword(password)
  if (hash !== user.passwordHash) return { error: "Invalid email or password." }

  const session = { email: user.email }
  setSession(session, remember)
  return { session }
}

export function logoutUser() {
  setSession(null)
}
