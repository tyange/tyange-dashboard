import { For, Show, createSignal, onMount } from 'solid-js'
import { fetchRssSources, subscribeRssSource, unsubscribeRssSource } from '../api'
import type { RssSourceRecord } from '../types'

function formatDateTime(value: string | null | undefined) {
  if (!value) return '없음'

  const date = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

<<<<<<< Updated upstream
=======
function formatPermissionLabel(permission: NotificationPermission) {
  if (permission === 'granted') {
    return '허용됨'
  }

  if (permission === 'denied') {
    return '차단됨'
  }

  return '미설정'
}

function summarizeEndpoint(endpoint: string) {
  if (endpoint.length <= 56) {
    return endpoint
  }

  return `${endpoint.slice(0, 24)}...${endpoint.slice(-24)}`
}

function buildPushSectionError(errors: string[]) {
  const messages = errors.filter(Boolean)
  return messages.length > 0 ? messages.join(' ') : null
}

>>>>>>> Stashed changes
export default function NotificationsPage() {
  const [rssSources, setRssSources] = createSignal<RssSourceRecord[]>([])
  const [rssLoading, setRssLoading] = createSignal(true)
  const [rssBusy, setRssBusy] = createSignal(false)
  const [removingSourceId, setRemovingSourceId] = createSignal<string | null>(null)
  const [rssInput, setRssInput] = createSignal('')
  const [rssErrorMessage, setRssErrorMessage] = createSignal<string | null>(null)
  const [rssSuccessMessage, setRssSuccessMessage] = createSignal<string | null>(null)

  const loadRssSources = async () => {
    setRssLoading(true)
    setRssErrorMessage(null)

    try {
      setRssSources(await fetchRssSources())
    } catch (error) {
      setRssSources([])
      setRssErrorMessage((error as Error).message)
    } finally {
      setRssLoading(false)
    }
  }

  onMount(() => {
    void loadRssSources()
  })

<<<<<<< Updated upstream
=======
  const handleSubscribeBrowser = async () => {
    if (pushBusy()) {
      return
    }

    setPushBusy(true)
    setPushErrorMessage(null)
    setPushSuccessMessage(null)

    try {
      if (pushPublicKeyAvailability() === 'unavailable') {
        return
      }

      if (!pushSupport.supported) {
        throw new Error(pushSupport.reason ?? '이 브라우저는 푸시 알림을 지원하지 않아요.')
      }

      const permission = await requestNotificationPermission()
      setNotificationPermission(permission)

      if (permission === 'denied') {
        throw new Error('알림이 차단돼 있어요. 브라우저 설정에서 허용한 뒤 다시 시도해 주세요.')
      }

      if (permission !== 'granted') {
        throw new Error('알림 권한을 허용해야 등록할 수 있어요.')
      }

      const publicKey = pushPublicKey()
      if (!publicKey) {
        throw new Error('준비가 아직 안 됐어요. 새로고침 후 다시 시도해 주세요.')
      }

      const currentStatus = browserPushStatus()
      if (currentStatus.localPayload && currentStatus.serverHasCurrentBrowser) {
        setPushSuccessMessage('이미 등록된 브라우저예요.')
        return
      }

      const subscription = await subscribeCurrentBrowser(publicKey)
      await savePushSubscription(toPushSubscriptionPayload(subscription))

      setPushSuccessMessage('이 브라우저를 알림 대상으로 등록했어요.')
      await loadPushData()
    } catch (error) {
      setPushErrorMessage((error as Error).message)
    } finally {
      setPushBusy(false)
    }
  }

  const handleUnsubscribeBrowser = async () => {
    if (pushBusy()) {
      return
    }

    const localSubscription = localPushSubscription()
    if (!localSubscription) {
      setPushErrorMessage('등록된 알림이 없어요.')
      setPushSuccessMessage(null)
      return
    }

    setPushBusy(true)
    setPushErrorMessage(null)
    setPushSuccessMessage(null)

    try {
      const failures: string[] = []

      try {
        const unsubscribed = await localSubscription.unsubscribe()
        if (!unsubscribed) {
          failures.push('브라우저 알림 해제에 실패했어요.')
        }
      } catch (error) {
        failures.push(`알림 해제 오류: ${(error as Error).message}`)
      }

      try {
        await deletePushSubscription(localSubscription.endpoint)
      } catch (error) {
        failures.push(`서버 정리 오류: ${(error as Error).message}`)
      }

      await loadPushData()

      if (failures.length > 0) {
        setPushErrorMessage(failures.join(' '))
        return
      }

      setPushSuccessMessage('이 브라우저의 알림 등록을 해제했어요.')
    } finally {
      setPushBusy(false)
    }
  }

>>>>>>> Stashed changes
  const handleAddRssSource = async () => {
    if (rssBusy()) return

    const feedUrl = rssInput().trim()
    if (!feedUrl) {
<<<<<<< Updated upstream
      setRssErrorMessage('RSS 주소를 입력해주세요.')
=======
      setRssErrorMessage('RSS 피드 URL을 입력해 주세요.')
>>>>>>> Stashed changes
      setRssSuccessMessage(null)
      return
    }

    setRssBusy(true)
    setRssErrorMessage(null)
    setRssSuccessMessage(null)

    try {
      await subscribeRssSource(feedUrl)
      setRssInput('')
<<<<<<< Updated upstream
      setRssSuccessMessage('구독을 추가했습니다.')
=======
      setRssSuccessMessage('RSS 구독을 추가했어요.')
>>>>>>> Stashed changes
      await loadRssSources()
    } catch (error) {
      setRssErrorMessage((error as Error).message)
    } finally {
      setRssBusy(false)
    }
  }

  const handleRemoveRssSource = async (sourceId: string) => {
    if (removingSourceId()) return

    setRemovingSourceId(sourceId)
    setRssErrorMessage(null)
    setRssSuccessMessage(null)

    try {
      await unsubscribeRssSource(sourceId)
<<<<<<< Updated upstream
      setRssSuccessMessage('구독을 해제했습니다.')
=======
      setRssSuccessMessage('RSS 구독을 해제했어요.')
>>>>>>> Stashed changes
      await loadRssSources()
    } catch (error) {
      setRssErrorMessage((error as Error).message)
    } finally {
      setRemovingSourceId(null)
    }
  }

  const primaryButton =
    'inline-flex h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-60'
  const ghostButton =
    'inline-flex h-11 items-center justify-center rounded-full border border-border/70 bg-card/82 px-4 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60'

  return (
<<<<<<< Updated upstream
    <section class="space-y-8 pb-10" aria-label="구독">
      <header class="space-y-3">
        <h1 class="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">구독</h1>
      </header>

      <section class="pt-8">
        <div class="mb-5 flex items-end justify-between gap-4">
          <h2 class="text-2xl font-semibold tracking-tight text-foreground">목록</h2>
        </div>

        <Show when={rssErrorMessage()}>
          {(message) => (
            <div class="mb-4 rounded-2xl border border-rose-400/30 bg-rose-500/8 px-4 py-3 text-sm text-rose-600">
              {message()}
=======
    <section class="space-y-6" aria-label="Notification settings">
      <div class="rounded-[2rem] border border-white/10 bg-card/80 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <p class="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Notifications</p>
        <h1 class="mt-3 text-2xl font-semibold tracking-tight text-foreground">알림 설정</h1>
        <p class="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          RSS 피드를 구독하고, 이 브라우저에서 알림을 받을 수 있어요.
        </p>
      </div>

      <div class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div class="rounded-[2rem] border border-white/10 bg-card/80 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Web Push</p>
              <h2 class="mt-2 text-xl font-semibold text-foreground">브라우저 알림 설정</h2>
              <p class="mt-2 text-sm leading-6 text-muted-foreground">
                이 브라우저의 알림 권한과 등록 상태를 확인하세요.
              </p>
>>>>>>> Stashed changes
            </div>
          )}
        </Show>

<<<<<<< Updated upstream
        <Show when={rssSuccessMessage()}>
          {(message) => (
            <div class="mb-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-600">
              {message()}
=======
          <Show when={pushErrorMessage()}>
            {(message) => (
              <div class="mt-4 rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {message()}
              </div>
            )}
          </Show>

          <Show when={pushSuccessMessage()}>
            {(message) => (
              <div class="mt-4 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                {message()}
              </div>
            )}
          </Show>

          <Show when={!pushLoading()} fallback={<p class="mt-6 text-sm text-muted-foreground">불러오는 중…</p>}>
            <div class="mt-6 grid gap-4 md:grid-cols-2">
              <div class="rounded-3xl border border-white/8 bg-black/20 p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">브라우저 권한</p>
                <p class="mt-2 text-lg font-semibold text-foreground">
                  {formatPermissionLabel(notificationPermission())}
                </p>
                <p class="mt-2 text-sm leading-6 text-muted-foreground">
                  {notificationPermission() === 'denied'
                    ? '브라우저 설정에서 알림을 허용해 주세요.'
                    : pushPublicKeyAvailability() === 'unavailable'
                      ? '서버에 푸시 기능이 아직 설정되지 않았어요.'
                    : '권한을 허용하면 이 브라우저에서 알림을 받을 수 있어요.'}
                </p>
              </div>

              <div class="rounded-3xl border border-white/8 bg-black/20 p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">현재 브라우저 상태</p>
                <p class="mt-2 text-lg font-semibold text-foreground">
                  {browserPushStatus().localSubscription ? '등록됨' : '미등록'}
                </p>
                <p class="mt-2 text-sm leading-6 text-muted-foreground">
                  {browserPushStatus().serverHasCurrentBrowser
                    ? '서버에도 등록돼 있어요.'
                    : '서버에는 아직 등록되지 않았어요.'}
                </p>
              </div>
>>>>>>> Stashed changes
            </div>
          )}
        </Show>

<<<<<<< Updated upstream
        <Show when={!rssLoading()} fallback={<p class="text-sm text-muted-foreground">구독 목록을 불러오는 중...</p>}>
          <div class="overflow-x-auto rounded-[1.25rem] border border-border/70">
            <table class="min-w-full border-collapse text-left text-sm">
              <thead class="bg-secondary/65 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th class="px-4 py-3 font-medium">소스 이름</th>
                  <th class="px-4 py-3 font-medium">사이트</th>
                  <th class="px-4 py-3 font-medium">상태</th>
                  <th class="px-4 py-3 font-medium">최근 확인</th>
                  <th class="px-4 py-3 font-medium">관리</th>
                </tr>
              </thead>
              <tbody class="bg-card/65">
                <Show
                  when={rssSources().length > 0}
                  fallback={
                    <tr>
                      <td colspan="5" class="px-4 py-6 text-muted-foreground">
                        아직 구독한 소스가 없습니다.
                      </td>
                    </tr>
                  }
                >
                  <For each={rssSources()}>
                    {(source) => (
                      <tr class="border-t border-border/60">
                        <td class="px-4 py-3 align-top">
                          <div>
                            <p class="text-base font-medium text-foreground">
                              {source.title || source.feed_url || `RSS #${source.source_id}`}
                            </p>
                            <Show when={source.feed_url}>
                              <p class="mt-1 break-all text-xs text-muted-foreground">{source.feed_url}</p>
                            </Show>
                            <Show when={source.last_error}>
                              <p class="mt-2 text-xs text-rose-600">{source.last_error}</p>
                            </Show>
=======
            <div class="mt-4 rounded-3xl border border-white/8 bg-black/20 p-4">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p class="text-sm font-semibold text-foreground">알림 등록</p>
                  <p class="mt-1 text-sm text-muted-foreground">
                    등록된 브라우저 {pushSubscriptions().length}개
                  </p>
                </div>
                <div class="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => void handleSubscribeBrowser()}
                    disabled={
                      pushBusy() ||
                      notificationPermission() === 'denied' ||
                      !pushSupport.supported ||
                      pushPublicKeyAvailability() !== 'available'
                    }
                    class="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pushBusy() ? '처리 중…' : '이 브라우저 등록'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleUnsubscribeBrowser()}
                    disabled={pushBusy() || !browserPushStatus().localSubscription}
                    class="inline-flex items-center justify-center rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    이 브라우저 해제
                  </button>
                </div>
              </div>

              <Show when={pushPublicKeyAvailability() === 'unavailable'}>
                <div class="mt-4 rounded-2xl border border-sky-400/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
                  푸시 알림 기능이 아직 설정되지 않았어요.
                </div>
              </Show>

              <Show when={browserPushStatus().localPayload}>
                {(payload) => (
                  <div class="mt-4 rounded-2xl border border-white/8 bg-background/40 px-4 py-3 text-sm text-muted-foreground">
                    <p class="font-medium text-foreground">브라우저 주소</p>
                    <p class="mt-1 break-all">{payload().endpoint}</p>
                  </div>
                )}
              </Show>
            </div>

            <div class="mt-6">
              <h3 class="text-base font-semibold text-foreground">등록된 브라우저 목록</h3>
              <Show
                when={pushSubscriptions().length > 0}
                fallback={<p class="mt-3 text-sm text-muted-foreground">아직 등록된 브라우저가 없어요.</p>}
              >
                <div class="mt-4 space-y-3">
                  <For each={pushSubscriptions()}>
                    {(subscription) => (
                      <article
                        class={`rounded-3xl border p-4 ${
                          browserPushStatus().matchedServerSubscription?.endpoint === subscription.endpoint
                            ? 'border-emerald-400/30 bg-emerald-500/10'
                            : 'border-white/8 bg-black/20'
                        }`}
                      >
                        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div class="min-w-0">
                            <div class="flex items-center gap-2">
                              <h4 class="truncate text-sm font-semibold text-foreground">
                                {summarizeEndpoint(subscription.endpoint)}
                              </h4>
                              <Show when={browserPushStatus().matchedServerSubscription?.endpoint === subscription.endpoint}>
                                <span class="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] text-emerald-200">
                                  CURRENT
                                </span>
                              </Show>
                            </div>
                            <dl class="mt-3 grid gap-2 text-sm text-muted-foreground">
                              <div>
                                <dt class="font-medium text-foreground">생성일</dt>
                                <dd>{formatDateTime(subscription.created_at)}</dd>
                              </div>
                              <div>
                                <dt class="font-medium text-foreground">수정일</dt>
                                <dd>{formatDateTime(subscription.updated_at)}</dd>
                              </div>
                            </dl>
>>>>>>> Stashed changes
                          </div>
                        </td>
                        <td class="px-4 py-3 align-top break-all text-muted-foreground">
                          {source.site_url || '-'}
                        </td>
                        <td class="px-4 py-3 align-top text-muted-foreground">
                          {source.status === 'active' ? '사용 중' : source.status || '-'}
                        </td>
                        <td class="px-4 py-3 align-top text-muted-foreground">
                          {formatDateTime(source.last_fetched_at)}
                        </td>
                        <td class="px-4 py-3 align-top">
                          <button
                            type="button"
                            onClick={() => void handleRemoveRssSource(source.source_id)}
                            disabled={removingSourceId() === source.source_id}
                            class={ghostButton}
                          >
                            {removingSourceId() === source.source_id ? '해제 중...' : '구독 해제'}
                          </button>
                        </td>
                      </tr>
                    )}
                  </For>
                </Show>
              </tbody>
            </table>
          </div>
        </Show>
      </section>

      <section class="pt-8">
        <div class="mb-5">
          <h2 class="text-2xl font-semibold tracking-tight text-foreground">RSS 추가</h2>
        </div>

<<<<<<< Updated upstream
        <div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <label class="block">
            <span class="mb-2 block text-xs uppercase tracking-[0.16em] text-muted-foreground">RSS 주소</span>
            <input
              type="url"
              value={rssInput()}
              onInput={(event) => setRssInput(event.currentTarget.value)}
              placeholder="https://example.com/feed.xml"
              class="w-full rounded-2xl border border-border/70 bg-background/82 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent"
            />
          </label>
          <div class="flex md:justify-end">
            <button type="button" onClick={() => void handleAddRssSource()} disabled={rssBusy()} class={primaryButton}>
              {rssBusy() ? '추가 중...' : '추가'}
            </button>
          </div>
=======
        <div class="rounded-[2rem] border border-white/10 bg-card/80 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.18em] text-accent">RSS Sources</p>
              <h2 class="mt-2 text-xl font-semibold text-foreground">RSS 구독 관리</h2>
              <p class="mt-2 text-sm leading-6 text-muted-foreground">
                RSS 피드를 등록하면 새 글이 올라올 때 알림을 받아요.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadRssSources()}
              class="inline-flex items-center justify-center rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              새로고침
            </button>
          </div>

          <div class="mt-6 rounded-3xl border border-white/8 bg-black/20 p-4">
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-foreground">RSS 피드 URL</span>
              <input
                type="url"
                value={rssInput()}
                onInput={(event) => setRssInput(event.currentTarget.value)}
                placeholder="https://example.com/feed.xml"
                class="w-full rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
              />
            </label>
            <div class="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => void handleAddRssSource()}
                disabled={rssBusy()}
                class="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {rssBusy() ? '추가 중…' : 'RSS 구독 추가'}
              </button>
            </div>
          </div>

          <Show when={rssErrorMessage()}>
            {(message) => (
              <div class="mt-4 rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {message()}
              </div>
            )}
          </Show>

          <Show when={rssSuccessMessage()}>
            {(message) => (
              <div class="mt-4 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                {message()}
              </div>
            )}
          </Show>

          <Show when={!rssLoading()} fallback={<p class="mt-6 text-sm text-muted-foreground">불러오는 중…</p>}>
            <Show
              when={rssSources().length > 0}
              fallback={<p class="mt-6 text-sm text-muted-foreground">아직 등록한 RSS 구독이 없어요.</p>}
            >
              <div class="mt-6 space-y-4">
                <For each={rssSources()}>
                  {(source) => (
                    <article class="rounded-3xl border border-white/8 bg-black/20 p-4">
                      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div class="min-w-0">
                          <h3 class="truncate text-base font-semibold text-foreground">
                            {source.title || source.feed_url || `RSS #${source.source_id}`}
                          </h3>
                          <dl class="mt-3 grid gap-2 text-sm text-muted-foreground">
                            <Show when={source.feed_url}>
                              <div>
                                <dt class="font-medium text-foreground">피드 URL</dt>
                                <dd class="break-all">{source.feed_url}</dd>
                              </div>
                            </Show>
                            <Show when={source.site_url}>
                              <div>
                                <dt class="font-medium text-foreground">사이트 URL</dt>
                                <dd class="break-all">{source.site_url}</dd>
                              </div>
                            </Show>
                            <Show when={source.status}>
                              <div>
                                <dt class="font-medium text-foreground">상태</dt>
                                <dd>{source.status}</dd>
                              </div>
                            </Show>
                            <div>
                              <dt class="font-medium text-foreground">최근 확인</dt>
                              <dd>{formatDateTime(source.last_fetched_at)}</dd>
                            </div>
                            <Show when={source.last_error}>
                              <div>
                                <dt class="font-medium text-foreground">최근 오류</dt>
                                <dd>{source.last_error}</dd>
                              </div>
                            </Show>
                          </dl>
                        </div>

                        <button
                          type="button"
                          onClick={() => void handleRemoveRssSource(source.source_id)}
                          disabled={removingSourceId() === source.source_id}
                          class="inline-flex shrink-0 items-center justify-center rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {removingSourceId() === source.source_id ? '해제 중…' : '구독 해제'}
                        </button>
                      </div>
                    </article>
                  )}
                </For>
              </div>
            </Show>
          </Show>
>>>>>>> Stashed changes
        </div>
      </section>
    </section>
  )
}
