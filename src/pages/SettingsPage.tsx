import { A } from '@solidjs/router'
import { Show, createMemo, createSignal, onMount } from 'solid-js'
import { useAuth } from '../auth/AuthProvider'
import ApiKeysPage from '../features/api-keys/components/ApiKeysPage'
import { deleteMyMatch, fetchMyMatch } from '../features/match/api'
import { clearProfileDraft, loadProfileDraft, profileDraftLimits, saveProfileDraft } from '../features/match/profileDraft'
import { buildProfileViewModel, formatMatchDateTime, getStatusBadgeClass, getStatusLabel, toProfileHref } from '../features/match/presentation'
import type { MatchSummary } from '../features/match/types'
import BrowserAlertsSettingsSection from '../features/notifications/components/BrowserAlertsSettingsSection'

export default function SettingsPage() {
  const auth = useAuth()
  const [displayName, setDisplayName] = createSignal('')
  const [bio, setBio] = createSignal('')
  const [profileMessage, setProfileMessage] = createSignal<string | null>(null)
  const [matchSummary, setMatchSummary] = createSignal<MatchSummary | null>(null)
  const [matchLoading, setMatchLoading] = createSignal(true)
  const [matchErrorMessage, setMatchErrorMessage] = createSignal<string | null>(null)
  const [disconnecting, setDisconnecting] = createSignal(false)

  const userId = createMemo(() => auth.session()?.user_id ?? '')
  const profile = createMemo(() =>
    buildProfileViewModel(userId(), userId(), {
      displayName: displayName(),
      bio: bio(),
    }),
  )

  const loadMatch = async () => {
    setMatchLoading(true)
    setMatchErrorMessage(null)

    try {
      setMatchSummary(await fetchMyMatch())
    } catch (error) {
      setMatchErrorMessage((error as Error).message)
      setMatchSummary(null)
    } finally {
      setMatchLoading(false)
    }
  }

  onMount(() => {
    const draft = loadProfileDraft(userId())
    setDisplayName(draft?.displayName ?? '')
    setBio(draft?.bio ?? '')
    void loadMatch()
  })

  const handleSaveProfile = () => {
    saveProfileDraft(userId(), {
      displayName: displayName(),
      bio: bio(),
    })
    setProfileMessage('프로필을 저장했어요.')
  }

  const handleResetProfile = () => {
    clearProfileDraft(userId())
    setDisplayName('')
    setBio('')
    setProfileMessage('프로필을 기본 상태로 되돌렸어요.')
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
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-foreground">
            {profile().initials}
          </div>
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
              maxLength={profileDraftLimits.displayName}
              onInput={(event) => setDisplayName(event.currentTarget.value)}
              placeholder="기본값 사용"
              class="w-full border-b border-border/80 bg-transparent px-0 py-3 text-sm text-foreground outline-none transition focus:border-foreground"
            />
          </label>

          <label class="block max-w-xl">
            <span class="mb-2 block text-xs uppercase tracking-[0.16em] text-muted-foreground">소개</span>
            <textarea
              rows="3"
              value={bio()}
              maxLength={profileDraftLimits.bio}
              onInput={(event) => setBio(event.currentTarget.value)}
              placeholder="기본값 사용"
              class="w-full border-b border-border/80 bg-transparent px-0 py-3 text-sm leading-6 text-foreground outline-none transition focus:border-foreground"
            />
          </label>

          <div class="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSaveProfile}
              class="inline-flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-sm font-semibold text-background transition hover:opacity-92"
            >
              저장
            </button>
            <button
              type="button"
              onClick={handleResetProfile}
              class="inline-flex h-10 items-center justify-center rounded-full border border-border/70 px-5 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              기본값으로
            </button>
            <span class="text-sm text-muted-foreground">{bio().length}/{profileDraftLimits.bio}</span>
          </div>

          <Show when={profileMessage()}>
            {(message) => <p class="text-sm text-emerald-600">{message()}</p>}
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
              <div class="mt-5 flex items-start justify-between gap-4">
                <div>
                  <div class="flex flex-wrap items-center gap-3">
                    <A
                      href={toProfileHref(currentMatch().counterpart_user_id)}
                      class="text-lg font-semibold text-foreground transition hover:text-primary"
                    >
                      @{currentMatch().counterpart_user_id}
                    </A>
                    <span class={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getStatusBadgeClass(currentMatch().status)}`}>
                      {getStatusLabel(currentMatch().status)}
                    </span>
                  </div>
                  <p class="mt-2 text-sm text-muted-foreground">{formatMatchDateTime(currentMatch().created_at)}</p>
                </div>

                <button
                  type="button"
                  onClick={() => void handleDisconnect()}
                  disabled={disconnecting()}
                  class="inline-flex h-10 items-center justify-center rounded-full border border-border/70 px-5 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {disconnecting() ? '처리 중…' : currentMatch().status === 'matched' ? '연결 해제' : '요청 취소'}
                </button>
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
