import { A } from '@solidjs/router'
import { Show, createEffect, createMemo, createSignal, onMount } from 'solid-js'
import { useAuth } from '../auth/AuthProvider'
import { getRequiredAccessToken, updateMyProfile } from '../auth/api'
import ApiKeysPage from '../features/api-keys/components/ApiKeysPage'
import { deleteMyMatch, fetchMatchMessages, fetchMyMatch } from '../features/match/api'
import { buildProfileViewModel, formatMatchDateTime, getProfileToneClasses, getStatusBadgeClass, getStatusLabel, toProfileHref } from '../features/match/presentation'
import type { MatchSummary } from '../features/match/types'
import BrowserAlertsSettingsSection from '../features/notifications/components/BrowserAlertsSettingsSection'

const PROFILE_LIMITS = {
  displayName: 32,
  avatarUrl: 512,
  bio: 160,
} as const

export default function SettingsPage() {
  const auth = useAuth()
  const [displayName, setDisplayName] = createSignal('')
  const [avatarUrl, setAvatarUrl] = createSignal('')
  const [bio, setBio] = createSignal('')
  const [profileMessage, setProfileMessage] = createSignal<string | null>(null)
  const [savingProfile, setSavingProfile] = createSignal(false)
  const [matchSummary, setMatchSummary] = createSignal<MatchSummary | null>(null)
  const [matchMessageCount, setMatchMessageCount] = createSignal(0)
  const [matchLoading, setMatchLoading] = createSignal(true)
  const [matchErrorMessage, setMatchErrorMessage] = createSignal<string | null>(null)
  const [disconnecting, setDisconnecting] = createSignal(false)

  const userId = createMemo(() => auth.session()?.user_id ?? '')
  const profile = createMemo(() =>
    buildProfileViewModel(userId(), userId(), {
      displayName: displayName(),
      avatarUrl: avatarUrl(),
      bio: bio(),
    }),
  )
  const counterpartProfile = createMemo(() => {
    const counterpartUserId = matchSummary()?.counterpart_user_id
    return counterpartUserId ? buildProfileViewModel(counterpartUserId, userId()) : null
  })

  const loadMatch = async () => {
    setMatchLoading(true)
    setMatchErrorMessage(null)

    try {
      const nextMatch = await fetchMyMatch()
      setMatchSummary(nextMatch)

      if (nextMatch?.status === 'matched') {
        const response = await fetchMatchMessages()
        setMatchMessageCount(response.messages.length)
      } else {
        setMatchMessageCount(0)
      }
    } catch (error) {
      setMatchErrorMessage((error as Error).message)
      setMatchSummary(null)
      setMatchMessageCount(0)
    } finally {
      setMatchLoading(false)
    }
  }

  createEffect(() => {
    setDisplayName(auth.session()?.display_name ?? '')
    setAvatarUrl(auth.session()?.avatar_url ?? '')
    setBio(auth.session()?.bio ?? '')
  })

  onMount(() => {
    void loadMatch()
  })

  const handleSaveProfile = async () => {
    if (savingProfile()) {
      return
    }

    setSavingProfile(true)
    setProfileMessage(null)
    setMatchErrorMessage(null)

    try {
      const nextMe = await updateMyProfile(getRequiredAccessToken(), {
        display_name: displayName(),
        avatar_url: avatarUrl(),
        bio: bio(),
      })
      auth.applyMe(nextMe)
      setProfileMessage('프로필을 저장했어요.')
    } catch (error) {
      setProfileMessage((error as Error).message)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleResetProfile = async () => {
    if (savingProfile()) {
      return
    }

    setDisplayName('')
    setAvatarUrl('')
    setBio('')
    setSavingProfile(true)

    try {
      const nextMe = await updateMyProfile(getRequiredAccessToken(), {
        display_name: '',
        avatar_url: '',
        bio: '',
      })
      auth.applyMe(nextMe)
      setProfileMessage('프로필을 비웠어요.')
    } catch (error) {
      setProfileMessage((error as Error).message)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleDisconnect = async () => {
    if (disconnecting()) {
      return
    }

    setDisconnecting(true)
    setMatchErrorMessage(null)

    try {
      await deleteMyMatch()
      setMatchSummary(null)
      setMatchMessageCount(0)
    } catch (error) {
      setMatchErrorMessage((error as Error).message)
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <section class="space-y-8 pb-10" aria-label="설정">
      <header>
        <h1 class="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">설정</h1>
      </header>

      <section class="pb-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-2xl font-semibold tracking-tight text-foreground">프로필</h2>
          </div>
          <A
            href={toProfileHref(userId())}
            class="inline-flex h-9 items-center justify-center text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            내 프로필
          </A>
        </div>

        <div class="mt-5 flex items-start gap-4 pt-1">
          <Show
            when={profile().avatarUrl}
            fallback={<div class="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-foreground">{profile().initials}</div>}
          >
            {(src) => <img src={src()} alt="" class="h-12 w-12 rounded-full object-cover" />}
          </Show>
          <div class="min-w-0 flex-1">
            <p class="text-lg font-semibold text-foreground">{profile().displayName}</p>
            <p class="mt-1 text-sm text-muted-foreground">{profile().handle}</p>
          </div>
        </div>

        <div class="mt-5 grid gap-5">
          <label class="block max-w-xl">
            <span class="mb-2 block text-xs uppercase tracking-[0.16em] text-muted-foreground">표시 이름</span>
            <input
              type="text"
              value={displayName()}
              maxLength={PROFILE_LIMITS.displayName}
              onInput={(event) => setDisplayName(event.currentTarget.value)}
              placeholder="기본값 사용"
              class="w-full border-b border-border/80 bg-transparent px-0 py-3 text-sm text-foreground outline-none transition focus:border-foreground"
            />
          </label>

          <label class="block max-w-xl">
            <span class="mb-2 block text-xs uppercase tracking-[0.16em] text-muted-foreground">프로필 사진 URL</span>
            <input
              type="url"
              value={avatarUrl()}
              maxLength={PROFILE_LIMITS.avatarUrl}
              onInput={(event) => setAvatarUrl(event.currentTarget.value)}
              placeholder="Google 기본값 또는 직접 입력"
              class="w-full border-b border-border/80 bg-transparent px-0 py-3 text-sm text-foreground outline-none transition focus:border-foreground"
            />
          </label>

          <label class="block max-w-xl">
            <span class="mb-2 block text-xs uppercase tracking-[0.16em] text-muted-foreground">소개</span>
            <textarea
              rows="3"
              value={bio()}
              maxLength={PROFILE_LIMITS.bio}
              onInput={(event) => setBio(event.currentTarget.value)}
              placeholder="기본값 사용"
              class="w-full border-b border-border/80 bg-transparent px-0 py-3 text-sm leading-6 text-foreground outline-none transition focus:border-foreground"
            />
          </label>

          <div class="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleSaveProfile()}
              disabled={savingProfile()}
              class="inline-flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-sm font-semibold text-background transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingProfile() ? '저장 중…' : '저장'}
            </button>
            <button
              type="button"
              onClick={() => void handleResetProfile()}
              disabled={savingProfile()}
              class="inline-flex h-10 items-center justify-center rounded-full border border-border/70 px-5 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              비우기
            </button>
            <span class="text-sm text-muted-foreground">{bio().length}/{PROFILE_LIMITS.bio}</span>
          </div>

          <Show when={profileMessage()}>
            {(message) => <p class={`text-sm ${message().startsWith('API ') ? 'text-rose-600' : 'text-emerald-600'}`}>{message()}</p>}
          </Show>
        </div>
      </section>

      <section class="pb-6">
        <h2 class="text-2xl font-semibold tracking-tight text-foreground">현재 상태</h2>

        <Show when={matchErrorMessage()}>
          {(message) => <div class="mt-4 px-1 py-3 text-sm text-rose-600">{message()}</div>}
        </Show>

        <Show when={!matchLoading()} fallback={<p class="mt-5 text-sm text-muted-foreground">상태를 불러오는 중...</p>}>
          <Show
            when={matchSummary()}
            fallback={<p class="mt-5 text-sm text-muted-foreground">현재 연결된 상대가 없습니다.</p>}
          >
            {(currentMatch) => (
              <div class="mt-5">
                <div class="flex items-start gap-3">
                  <A
                    href={toProfileHref(currentMatch().counterpart_user_id)}
                    class={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getProfileToneClasses(counterpartProfile()?.tone ?? profile().tone)} text-sm font-semibold text-foreground`}
                    aria-label={`${currentMatch().counterpart_user_id} 프로필`}
                  >
                    {counterpartProfile()?.initials ?? profile().initials}
                  </A>
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <A
                        href={toProfileHref(currentMatch().counterpart_user_id)}
                        class="truncate text-lg font-semibold tracking-tight text-foreground transition hover:text-primary"
                      >
                        @{currentMatch().counterpart_user_id}
                      </A>
                      <span class={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getStatusBadgeClass(currentMatch().status)}`}>
                        {getStatusLabel(currentMatch().status)}
                      </span>
                      <span class="text-sm text-muted-foreground">
                        {currentMatch().status === 'matched'
                          ? `${matchMessageCount()}개 메시지`
                          : formatMatchDateTime(currentMatch().created_at)}
                      </span>
                    </div>
                    <p class="mt-2 text-sm text-muted-foreground">
                      {currentMatch().status === 'matched'
                        ? '연결이 확정되었습니다. 프로필과 대화 흐름을 같은 화면에서 자연스럽게 오갈 수 있습니다.'
                        : '상대의 응답을 기다리고 있습니다.'}
                    </p>
                  </div>

                  <div class="flex shrink-0 items-center gap-2">
                    <A
                      href={toProfileHref(currentMatch().counterpart_user_id)}
                      class="inline-flex h-9 items-center justify-center px-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                    >
                      프로필
                    </A>
                    <button
                      type="button"
                      onClick={() => void handleDisconnect()}
                      disabled={disconnecting()}
                      class="inline-flex h-9 items-center justify-center px-2 text-sm font-medium text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {disconnecting() ? '처리 중…' : currentMatch().status === 'matched' ? '연결 해제' : '요청 취소'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Show>
        </Show>
      </section>

      <BrowserAlertsSettingsSection title="브라우저 알림" showTechnicalDetails />

      <ApiKeysPage embedded />
    </section>
  )
}
