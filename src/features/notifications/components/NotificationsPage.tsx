import { For, Show, createMemo, createSignal, onMount } from 'solid-js'
import {
  deletePushSubscription,
  fetchPushPublicKeyState,
  fetchRssSources,
  fetchSavedPushSubscriptions,
  savePushSubscription,
  subscribeRssSource,
  unsubscribeRssSource,
} from '../api'
import {
  getNotificationPermissionState,
  getCurrentPushSubscription,
  getPushSupportState,
  requestNotificationPermission,
  subscribeCurrentBrowser,
  toPushSubscriptionPayload,
} from '../push'
import { reconcileBrowserPushStatus } from '../reconcile'
import type {
  PushPublicKeyAvailability,
  RssSourceRecord,
  SavedPushSubscriptionRecord,
} from '../types'

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

function formatPermissionLabel(permission: NotificationPermission) {
  if (permission === 'granted') return '허용됨'
  if (permission === 'denied') return '차단됨'
  return '아직 선택 전'
}

function summarizeEndpoint(endpoint: string) {
  if (endpoint.length <= 56) return endpoint
  return `${endpoint.slice(0, 24)}...${endpoint.slice(-24)}`
}

function buildPushSectionError(errors: string[]) {
  const messages = errors.filter(Boolean)
  return messages.length > 0 ? messages.join(' ') : null
}

export default function NotificationsPage() {
  const pushSupport = getPushSupportState()
  const [pushPublicKey, setPushPublicKey] = createSignal<string | null>(null)
  const [pushPublicKeyAvailability, setPushPublicKeyAvailability] =
    createSignal<PushPublicKeyAvailability>('available')
  const [pushSubscriptions, setPushSubscriptions] = createSignal<SavedPushSubscriptionRecord[]>([])
  const [rssSources, setRssSources] = createSignal<RssSourceRecord[]>([])
  const [localPushSubscription, setLocalPushSubscription] = createSignal<PushSubscription | null>(null)
  const [notificationPermission, setNotificationPermission] =
    createSignal<NotificationPermission>(getNotificationPermissionState())
  const [pushLoading, setPushLoading] = createSignal(true)
  const [rssLoading, setRssLoading] = createSignal(true)
  const [pushBusy, setPushBusy] = createSignal(false)
  const [rssBusy, setRssBusy] = createSignal(false)
  const [removingSourceId, setRemovingSourceId] = createSignal<string | null>(null)
  const [rssInput, setRssInput] = createSignal('')
  const [pushErrorMessage, setPushErrorMessage] = createSignal<string | null>(null)
  const [rssErrorMessage, setRssErrorMessage] = createSignal<string | null>(null)
  const [pushSuccessMessage, setPushSuccessMessage] = createSignal<string | null>(null)
  const [rssSuccessMessage, setRssSuccessMessage] = createSignal<string | null>(null)

  const browserPushStatus = createMemo(() =>
    reconcileBrowserPushStatus(localPushSubscription(), pushSubscriptions()),
  )

  const loadBrowserPushState = async () => {
    setNotificationPermission(getNotificationPermissionState())

    if (!pushSupport.supported) {
      setLocalPushSubscription(null)
      return
    }

    const subscription = await getCurrentPushSubscription()
    setLocalPushSubscription(subscription)
  }

  const loadPushData = async () => {
    setPushLoading(true)
    setPushErrorMessage(null)

    const errors: string[] = []
    const results = await Promise.allSettled([
      fetchPushPublicKeyState(),
      fetchSavedPushSubscriptions(),
      loadBrowserPushState(),
    ])

    const [publicKeyResult, serverSubscriptionsResult, browserStateResult] = results

    if (publicKeyResult.status === 'fulfilled') {
      setPushPublicKeyAvailability(publicKeyResult.value.availability)
      if (publicKeyResult.value.availability === 'available') {
        setPushPublicKey(publicKeyResult.value.publicKey)
      } else {
        setPushPublicKey(null)
      }

      if (publicKeyResult.value.availability === 'error') {
        errors.push(publicKeyResult.value.error.message)
      }
    } else {
      setPushPublicKeyAvailability('error')
      setPushPublicKey(null)
      errors.push((publicKeyResult.reason as Error).message)
    }

    if (serverSubscriptionsResult.status === 'fulfilled') {
      setPushSubscriptions(serverSubscriptionsResult.value)
    } else {
      setPushSubscriptions([])
      errors.push((serverSubscriptionsResult.reason as Error).message)
    }

    if (browserStateResult.status === 'rejected') {
      setLocalPushSubscription(null)
      errors.push((browserStateResult.reason as Error).message)
    }

    if (!pushSupport.supported && pushSupport.reason) {
      errors.push(pushSupport.reason)
    }

    setPushErrorMessage(buildPushSectionError(errors))
    setPushLoading(false)
  }

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
    void Promise.all([loadPushData(), loadRssSources()])
  })

  const handleSubscribeBrowser = async () => {
    if (pushBusy()) return

    setPushBusy(true)
    setPushErrorMessage(null)
    setPushSuccessMessage(null)

    try {
      if (pushPublicKeyAvailability() === 'unavailable') return
      if (!pushSupport.supported) {
        throw new Error(pushSupport.reason ?? '이 브라우저는 푸시 알림을 지원하지 않습니다.')
      }

      const permission = await requestNotificationPermission()
      setNotificationPermission(permission)

      if (permission === 'denied') {
        throw new Error('브라우저에서 이 사이트의 알림 권한이 차단되어 있습니다. 브라우저 설정에서 권한을 허용한 뒤 다시 시도해주세요.')
      }

      if (permission !== 'granted') {
        throw new Error('알림 권한을 허용해야 현재 브라우저를 푸시 수신 대상으로 등록할 수 있습니다.')
      }

      const publicKey = pushPublicKey()
      if (!publicKey) {
        throw new Error('푸시 공개 키를 아직 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.')
      }

      const currentStatus = browserPushStatus()
      if (currentStatus.localPayload && currentStatus.serverHasCurrentBrowser) {
        setPushSuccessMessage('현재 브라우저가 이미 푸시 알림 대상으로 등록되어 있습니다.')
        return
      }

      const subscription = await subscribeCurrentBrowser(publicKey)
      await savePushSubscription(toPushSubscriptionPayload(subscription))

      setPushSuccessMessage('현재 브라우저를 푸시 알림 대상으로 등록했습니다.')
      await loadPushData()
    } catch (error) {
      setPushErrorMessage((error as Error).message)
    } finally {
      setPushBusy(false)
    }
  }

  const handleUnsubscribeBrowser = async () => {
    if (pushBusy()) return

    const localSubscription = localPushSubscription()
    if (!localSubscription) {
      setPushErrorMessage('현재 브라우저에 등록된 푸시 구독이 없습니다.')
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
          failures.push('브라우저 로컬 구독 해제에 실패했습니다.')
        }
      } catch (error) {
        failures.push(`브라우저 구독 해제 오류: ${(error as Error).message}`)
      }

      try {
        await deletePushSubscription(localSubscription.endpoint)
      } catch (error) {
        failures.push(`서버 구독 정리 오류: ${(error as Error).message}`)
      }

      await loadPushData()

      if (failures.length > 0) {
        setPushErrorMessage(failures.join(' '))
        return
      }

      setPushSuccessMessage('현재 브라우저의 푸시 알림 등록을 해제했습니다.')
    } finally {
      setPushBusy(false)
    }
  }

  const handleAddRssSource = async () => {
    if (rssBusy()) return

    const feedUrl = rssInput().trim()
    if (!feedUrl) {
      setRssErrorMessage('RSS 피드 URL을 입력해주세요.')
      setRssSuccessMessage(null)
      return
    }

    setRssBusy(true)
    setRssErrorMessage(null)
    setRssSuccessMessage(null)

    try {
      await subscribeRssSource(feedUrl)
      setRssInput('')
      setRssSuccessMessage('RSS 구독을 추가했습니다.')
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
      setRssSuccessMessage('RSS 구독을 해제했습니다.')
      await loadRssSources()
    } catch (error) {
      setRssErrorMessage((error as Error).message)
    } finally {
      setRemovingSourceId(null)
    }
  }

  const ghostButton =
    'inline-flex h-11 items-center justify-center rounded-full border border-border/70 bg-card/82 px-4 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60'
  const primaryButton =
    'inline-flex h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-60'
  const statCell = 'rounded-2xl border border-border/70 bg-background/78 px-4 py-4'

  return (
    <section class="space-y-8 pb-10" aria-label="Notification settings">
      <header class="flex flex-col gap-4">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">Notifications</p>
          <h1 class="mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">알림 관리</h1>
        </div>
      </header>

      <section class="border-b border-t border-border/70 py-5">
        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div class={statCell}>
            <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">브라우저 권한</p>
            <p class="mt-2 text-2xl font-semibold text-foreground">{formatPermissionLabel(notificationPermission())}</p>
          </div>
          <div class={statCell}>
            <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">현재 브라우저</p>
            <p class="mt-2 text-2xl font-semibold text-foreground">
              {browserPushStatus().localSubscription ? '로컬 구독 있음' : '로컬 구독 없음'}
            </p>
          </div>
          <div class={statCell}>
            <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">서버 저장 구독</p>
            <p class="mt-2 text-2xl font-semibold text-foreground">{pushSubscriptions().length}개</p>
          </div>
          <div class={statCell}>
            <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">RSS 소스</p>
            <p class="mt-2 text-2xl font-semibold text-foreground">{rssSources().length}개</p>
          </div>
        </div>
      </section>

      <div class="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <section class="border-t border-border/70 pt-8">
          <div>
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Web Push</p>
              <h2 class="mt-3 text-2xl font-semibold tracking-tight text-foreground">현재 브라우저 알림 등록</h2>
            </div>
          </div>

          <Show when={pushErrorMessage()}>
            {(message) => (
              <div class="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/8 px-4 py-3 text-sm text-rose-600">
                {message()}
              </div>
            )}
          </Show>

          <Show when={pushSuccessMessage()}>
            {(message) => (
              <div class="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-600">
                {message()}
              </div>
            )}
          </Show>

          <Show when={!pushLoading()} fallback={<p class="mt-6 text-sm text-muted-foreground">푸시 설정을 불러오는 중...</p>}>
            <div class="mt-6 space-y-4">
              <div class="grid gap-3 md:grid-cols-2">
                <div class={statCell}>
                  <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">푸시 가능 여부</p>
                  <p class="mt-2 text-lg font-semibold text-foreground">
                    {pushPublicKeyAvailability() === 'unavailable' ? '서버 미설정' : pushSupport.supported ? '지원됨' : '지원 안 됨'}
                  </p>
                  <p class="mt-2 text-sm leading-6 text-muted-foreground">
                    {notificationPermission() === 'denied'
                      ? '브라우저 설정에서 이 사이트 알림 권한을 다시 허용해야 합니다.'
                      : pushPublicKeyAvailability() === 'unavailable'
                        ? '현재 서버에서는 푸시 공개 키가 아직 설정되지 않았습니다.'
                        : '권한이 허용되면 이 브라우저를 푸시 수신 대상으로 등록할 수 있습니다.'}
                  </p>
                </div>
                <div class={statCell}>
                  <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">서버 동기화 상태</p>
                  <p class="mt-2 text-lg font-semibold text-foreground">
                    {browserPushStatus().serverHasCurrentBrowser ? '서버에도 저장됨' : '서버에는 아직 없음'}
                  </p>
                  <p class="mt-2 text-sm leading-6 text-muted-foreground">
                    {browserPushStatus().serverHasCurrentBrowser
                      ? '현재 브라우저의 로컬 구독이 서버 구독과 일치합니다.'
                      : '로컬 구독이 있어도 서버 저장이 없을 수 있으니 등록 버튼으로 다시 맞출 수 있습니다.'}
                  </p>
                </div>
              </div>

              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleSubscribeBrowser()}
                  disabled={
                    pushBusy() ||
                    notificationPermission() === 'denied' ||
                    !pushSupport.supported ||
                    pushPublicKeyAvailability() !== 'available'
                  }
                  class={primaryButton}
                >
                  {pushBusy() ? '처리 중...' : '현재 브라우저 등록'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleUnsubscribeBrowser()}
                  disabled={pushBusy() || !browserPushStatus().localSubscription}
                  class={ghostButton}
                >
                  현재 브라우저 해제
                </button>
              </div>

              <Show when={pushPublicKeyAvailability() === 'unavailable'}>
                  <div class="rounded-2xl border border-sky-400/24 bg-sky-500/8 px-4 py-3 text-sm text-sky-700">
                  현재 푸시 알림 기능이 아직 설정되지 않았습니다.
                </div>
              </Show>

              <Show when={browserPushStatus().localPayload}>
                {(payload) => (
                  <div class="rounded-2xl border border-border/70 bg-card/82 px-4 py-3 text-sm text-muted-foreground">
                    <p class="font-medium text-foreground">로컬 엔드포인트</p>
                    <p class="mt-1 break-all">{payload().endpoint}</p>
                  </div>
                )}
              </Show>

              <div class="overflow-x-auto rounded-[1.25rem] border border-border/70">
                <table class="min-w-full border-collapse text-left text-sm">
                  <thead class="bg-secondary/65 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    <tr>
                      <th class="px-4 py-3 font-medium">엔드포인트</th>
                      <th class="px-4 py-3 font-medium">현재 브라우저</th>
                      <th class="px-4 py-3 font-medium">생성일</th>
                      <th class="px-4 py-3 font-medium">수정일</th>
                    </tr>
                  </thead>
                  <tbody class="bg-card/65">
                    <Show when={pushSubscriptions().length > 0} fallback={
                      <tr>
                        <td colspan="4" class="px-4 py-4 text-muted-foreground">아직 저장된 브라우저 푸시 구독이 없습니다.</td>
                      </tr>
                    }>
                      <For each={pushSubscriptions()}>
                        {(subscription) => (
                          <tr class="border-t border-border/60">
                            <td class="px-4 py-3 align-middle text-foreground">{summarizeEndpoint(subscription.endpoint)}</td>
                            <td class="px-4 py-3 align-middle">
                              <Show when={browserPushStatus().matchedServerSubscription?.endpoint === subscription.endpoint} fallback={<span class="text-muted-foreground">-</span>}>
                                <span class="rounded-full bg-emerald-500/14 px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] text-emerald-700">
                                  CURRENT
                                </span>
                              </Show>
                            </td>
                            <td class="px-4 py-3 align-middle text-muted-foreground">{formatDateTime(subscription.created_at)}</td>
                            <td class="px-4 py-3 align-middle text-muted-foreground">{formatDateTime(subscription.updated_at)}</td>
                          </tr>
                        )}
                      </For>
                    </Show>
                  </tbody>
                </table>
              </div>
            </div>
          </Show>
        </section>

        <section class="border-t border-border/70 pt-8">
          <div>
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-accent">RSS Sources</p>
              <h2 class="mt-3 text-2xl font-semibold tracking-tight text-foreground">RSS 구독 관리</h2>
            </div>
          </div>

          <div class="mt-6 grid gap-4">
            <label class="block">
              <span class="mb-2 block text-xs uppercase tracking-[0.16em] text-muted-foreground">RSS 피드 URL</span>
              <input
                type="url"
                value={rssInput()}
                onInput={(event) => setRssInput(event.currentTarget.value)}
                placeholder="https://example.com/feed.xml"
                class="w-full rounded-2xl border border-border/70 bg-background/82 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent"
              />
            </label>
            <div class="flex justify-end">
              <button type="button" onClick={() => void handleAddRssSource()} disabled={rssBusy()} class={primaryButton}>
                {rssBusy() ? '추가 중...' : 'RSS 구독 추가'}
              </button>
            </div>
          </div>

          <Show when={rssErrorMessage()}>
            {(message) => (
              <div class="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/8 px-4 py-3 text-sm text-rose-600">
                {message()}
              </div>
            )}
          </Show>

          <Show when={rssSuccessMessage()}>
            {(message) => (
              <div class="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-600">
                {message()}
              </div>
            )}
          </Show>

          <Show when={!rssLoading()} fallback={<p class="mt-6 text-sm text-muted-foreground">RSS 구독 목록을 불러오는 중...</p>}>
            <div class="mt-6 overflow-x-auto rounded-[1.25rem] border border-border/70">
              <table class="min-w-full border-collapse text-left text-sm">
                <thead class="bg-secondary/65 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  <tr>
                    <th class="px-4 py-3 font-medium">이름</th>
                    <th class="px-4 py-3 font-medium">피드 URL</th>
                    <th class="px-4 py-3 font-medium">상태</th>
                    <th class="px-4 py-3 font-medium">최근 확인</th>
                    <th class="px-4 py-3 font-medium">관리</th>
                  </tr>
                </thead>
                <tbody class="bg-card/65">
                  <Show when={rssSources().length > 0} fallback={
                    <tr>
                      <td colspan="5" class="px-4 py-4 text-muted-foreground">아직 등록한 RSS 구독이 없습니다.</td>
                    </tr>
                  }>
                    <For each={rssSources()}>
                      {(source) => (
                        <tr class="border-t border-border/60">
                          <td class="px-4 py-3 align-top">
                            <div>
                              <p class="text-base font-medium text-foreground">{source.title || source.feed_url || `RSS #${source.source_id}`}</p>
                              <Show when={source.site_url}>
                                <p class="mt-1 break-all text-xs text-muted-foreground">{source.site_url}</p>
                              </Show>
                              <Show when={source.last_error}>
                                <p class="mt-2 text-xs text-rose-600">{source.last_error}</p>
                              </Show>
                            </div>
                          </td>
                          <td class="px-4 py-3 align-top break-all text-muted-foreground">{source.feed_url || '-'}</td>
                          <td class="px-4 py-3 align-top text-muted-foreground">{source.status || '-'}</td>
                          <td class="px-4 py-3 align-top text-muted-foreground">{formatDateTime(source.last_fetched_at)}</td>
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
      </div>
    </section>
  )
}
