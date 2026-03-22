export type ProfileDraft = {
  displayName: string
  bio: string
}

const PROFILE_DRAFT_STORAGE_KEY = 'tyange-dashboard.profile-draft'
const MAX_DISPLAY_NAME_LENGTH = 32
const MAX_BIO_LENGTH = 160

function isBrowser() {
  return typeof window !== 'undefined'
}

function sanitizeDraft(draft: Partial<ProfileDraft> | null | undefined): ProfileDraft | null {
  if (!draft) {
    return null
  }

  const displayName = typeof draft.displayName === 'string' ? draft.displayName.trim().slice(0, MAX_DISPLAY_NAME_LENGTH) : ''
  const bio = typeof draft.bio === 'string' ? draft.bio.trim().slice(0, MAX_BIO_LENGTH) : ''

  if (!displayName && !bio) {
    return null
  }

  return { displayName, bio }
}

function loadAllDrafts() {
  if (!isBrowser()) {
    return {} as Record<string, ProfileDraft>
  }

  const raw = window.localStorage.getItem(PROFILE_DRAFT_STORAGE_KEY)
  if (!raw) {
    return {} as Record<string, ProfileDraft>
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, Partial<ProfileDraft>>
    const entries = Object.entries(parsed)
      .map(([userId, draft]) => [userId, sanitizeDraft(draft)] as const)
      .filter((entry): entry is readonly [string, ProfileDraft] => Boolean(entry[1]))

    return Object.fromEntries(entries)
  } catch {
    window.localStorage.removeItem(PROFILE_DRAFT_STORAGE_KEY)
    return {} as Record<string, ProfileDraft>
  }
}

function storeAllDrafts(drafts: Record<string, ProfileDraft>) {
  if (!isBrowser()) {
    return
  }

  if (Object.keys(drafts).length === 0) {
    window.localStorage.removeItem(PROFILE_DRAFT_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(PROFILE_DRAFT_STORAGE_KEY, JSON.stringify(drafts))
}

export function loadProfileDraft(userId: string): ProfileDraft | null {
  if (!userId) {
    return null
  }

  return loadAllDrafts()[userId] ?? null
}

export function saveProfileDraft(userId: string, draft: Partial<ProfileDraft>) {
  if (!userId) {
    return null
  }

  const allDrafts = loadAllDrafts()
  const sanitized = sanitizeDraft(draft)

  if (!sanitized) {
    delete allDrafts[userId]
    storeAllDrafts(allDrafts)
    return null
  }

  allDrafts[userId] = sanitized
  storeAllDrafts(allDrafts)
  return sanitized
}

export function clearProfileDraft(userId: string) {
  if (!userId) {
    return
  }

  const allDrafts = loadAllDrafts()
  delete allDrafts[userId]
  storeAllDrafts(allDrafts)
}

export const profileDraftLimits = {
  displayName: MAX_DISPLAY_NAME_LENGTH,
  bio: MAX_BIO_LENGTH,
} as const
