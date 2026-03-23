import type { MatchMessage, MatchStatus, MatchSummary } from './types'

export type ProfileTone = 'cobalt' | 'mint' | 'amber' | 'slate'

export type ProfileViewModel = {
  userId: string
  handle: string
  displayName: string
  initials: string
  avatarUrl: string | null
  bio: string
  note: string
  tone: ProfileTone
}

export type ProfileIdentitySource = {
  displayName?: string | null
  avatarUrl?: string | null
  bio?: string | null
}

export type RelationshipKind = 'self' | 'matched' | 'pending-outgoing' | 'pending-incoming' | 'inactive'

export type RelationshipState = {
  kind: RelationshipKind
  label: string
  description: string
}

export type TimelineEntry =
  | {
      type: 'day'
      key: string
      label: string
    }
  | {
      type: 'message'
      key: string
      message: MatchMessage
      isMine: boolean
      senderName: string
      handle: string
      displayTime: string
    }

const PROFILE_BIOS = [
  '짧은 문장으로 리듬을 맞추는 1:1 타임라인 프리뷰입니다.',
  '가볍게 시작해서 선명하게 이어지는 대화를 위한 프로필입니다.',
  '한 사람과 천천히 쌓이는 대화 흐름을 보여주는 임시 프로필입니다.',
  '지금은 user id 중심이지만, 톤과 존재감은 이미 준비된 상태입니다.',
] as const

const PROFILE_NOTES = [
  '프로필 API 연결 전까지는 계정 식별자에서 파생한 정보만 보여줍니다.',
  '이 화면은 실제 프로필 데이터 대신 현재 대화 맥락을 우선합니다.',
  '고정된 자기소개 대신 현재 연결 상태와 최근 대화 흐름을 보여줍니다.',
  '지금 단계에서는 과장된 정보보다 읽기 쉬운 구조를 우선합니다.',
] as const

const PROFILE_TONES: ProfileTone[] = ['cobalt', 'mint', 'amber', 'slate']

function parseDate(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const date = new Date(value.replace(' ', 'T'))
  return Number.isNaN(date.getTime()) ? null : date
}

function hashString(value: string) {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash
}

function capitalizeWord(value: string) {
  if (!value) {
    return ''
  }

  return value.charAt(0).toUpperCase() + value.slice(1)
}

function prettifyUserId(userId: string) {
  const localPart = userId.split('@')[0] ?? userId
  const normalized = localPart.replace(/[._-]+/g, ' ').trim()

  if (!normalized) {
    return 'User'
  }

  return normalized
    .split(/\s+/)
    .slice(0, 2)
    .map(capitalizeWord)
    .join(' ')
}

function buildInitials(userId: string) {
  const letters = userId.replace(/[^A-Za-z0-9가-힣]/g, '')

  if (!letters) {
    return 'U'
  }

  return letters.slice(0, 2).toUpperCase()
}

function formatDate(value: string | null | undefined, options: Intl.DateTimeFormatOptions) {
  const date = parseDate(value)
  if (!date) {
    return value ?? ''
  }

  return new Intl.DateTimeFormat('ko-KR', options).format(date)
}

export function toProfileHref(userId: string) {
  return `/profile/${encodeURIComponent(userId)}`
}

export function buildProfileViewModel(
  userId: string,
  currentUserId?: string,
  source?: ProfileIdentitySource,
): ProfileViewModel {
  const normalized = userId.trim() || 'user'
  const hash = hashString(normalized)
  const isSelf = Boolean(currentUserId) && normalized === currentUserId
  const displayName = source?.displayName?.trim()
  const bio = source?.bio?.trim()
  const avatarUrl = source?.avatarUrl?.trim()

  return {
    userId: normalized,
    handle: `@${normalized}`,
    displayName: displayName || (isSelf ? '나' : prettifyUserId(normalized)),
    initials: isSelf ? 'ME' : buildInitials(normalized),
    avatarUrl: avatarUrl || null,
    bio: bio || (isSelf ? '지금 열려 있는 1:1 타임라인을 관리하는 내 프로필 미리보기입니다.' : PROFILE_BIOS[hash % PROFILE_BIOS.length]),
    note: isSelf
      ? '실제 프로필 API 연결 전까지는 내 계정 ID와 현재 연결 상태를 기준으로 보여줍니다.'
      : PROFILE_NOTES[(hash >> 3) % PROFILE_NOTES.length],
    tone: PROFILE_TONES[hash % PROFILE_TONES.length],
  }
}

export function getProfileToneClasses(tone: ProfileTone) {
  switch (tone) {
    case 'mint':
      return 'from-emerald-400/28 via-teal-400/14 to-transparent text-emerald-600 dark:text-emerald-300'
    case 'amber':
      return 'from-amber-400/28 via-orange-400/14 to-transparent text-amber-700 dark:text-amber-300'
    case 'slate':
      return 'from-slate-400/24 via-zinc-400/12 to-transparent text-slate-700 dark:text-slate-200'
    case 'cobalt':
    default:
      return 'from-sky-400/28 via-indigo-400/14 to-transparent text-sky-700 dark:text-sky-300'
  }
}

export function getStatusLabel(status: MatchStatus) {
  if (status === 'matched') {
    return '연결됨'
  }

  if (status === 'pending') {
    return '응답 대기'
  }

  return status
}

export function getStatusBadgeClass(status: MatchStatus) {
  switch (status) {
    case 'matched':
      return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    case 'pending':
      return 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300'
    default:
      return 'border-border bg-secondary text-muted-foreground'
  }
}

export function buildRelationshipState(
  matchSummary: MatchSummary | null,
  currentUserId: string,
  profileUserId: string | null,
): RelationshipState {
  if (!profileUserId) {
    return {
      kind: 'inactive',
      label: '연결 없음',
      description: '프로필을 불러올 수 없습니다.',
    }
  }

  if (profileUserId === currentUserId) {
    return {
      kind: 'self',
      label: '내 프로필',
      description: '현재 로그인한 계정의 미리보기 프로필입니다.',
    }
  }

  if (!matchSummary || matchSummary.counterpart_user_id !== profileUserId) {
    return {
      kind: 'inactive',
      label: '연결 없음',
      description: '현재 열려 있는 1:1 연결과 직접 이어지지 않은 사용자입니다.',
    }
  }

  if (matchSummary.status === 'matched') {
    return {
      kind: 'matched',
      label: '연결됨',
      description: '지금 이 사용자와 1:1 타임라인이 열려 있습니다.',
    }
  }

  if (matchSummary.status === 'pending' && matchSummary.requester_user_id === currentUserId) {
    return {
      kind: 'pending-outgoing',
      label: '응답 대기',
      description: '내가 요청을 보냈고, 상대의 수락을 기다리는 중입니다.',
    }
  }

  if (matchSummary.status === 'pending') {
    return {
      kind: 'pending-incoming',
      label: '내 응답 필요',
      description: '상대가 보낸 요청이 도착했고, 내가 응답할 차례입니다.',
    }
  }

  return {
    kind: 'inactive',
    label: '연결 없음',
    description: '이 프로필과 연결된 활성 상태가 없습니다.',
  }
}

export function getRelationshipBadgeClass(kind: RelationshipKind) {
  switch (kind) {
    case 'matched':
      return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    case 'pending-outgoing':
      return 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300'
    case 'pending-incoming':
      return 'border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300'
    case 'self':
      return 'border-border bg-secondary text-foreground'
    case 'inactive':
    default:
      return 'border-border bg-secondary text-muted-foreground'
  }
}

export function formatMatchDateTime(value: string | null | undefined) {
  if (!value) {
    return '없음'
  }

  return formatDate(value, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTimelineTime(value: string | null | undefined) {
  return formatDate(value, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTimelineDay(value: string) {
  return formatDate(value, {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

function createDayKey(value: string) {
  const date = parseDate(value)
  if (!date) {
    return value
  }

  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function buildTimelineEntries(messages: MatchMessage[], currentUserId: string): TimelineEntry[] {
  const entries: TimelineEntry[] = []
  let lastDayKey: string | null = null

  for (const message of messages) {
    const dayKey = createDayKey(message.created_at)

    if (dayKey !== lastDayKey) {
      entries.push({
        type: 'day',
        key: `day-${dayKey}`,
        label: formatTimelineDay(message.created_at),
      })
      lastDayKey = dayKey
    }

    const isMine = message.sender_user_id === currentUserId
    const profile = buildProfileViewModel(message.sender_user_id, currentUserId)

    entries.push({
      type: 'message',
      key: `message-${message.message_id}`,
      message,
      isMine,
      senderName: isMine ? '나' : profile.displayName,
      handle: profile.handle,
      displayTime: formatTimelineTime(message.created_at),
    })
  }

  return entries
}
