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
  if (!value) {
    return '없음'
  }

  const date = new Date(value.replace(' ', 'T'))

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatPermissionLabel(permission: NotificationPermission) {
  if (permission === 'granted') {
    return '허용됨'
  }

  if (permission === 'denied') {
    return '차단됨'
  }

  return '아직 선택 전'
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
    if (pushBusy()) {
      return
    }

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
    if (rssBusy()) {
      return
    }

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
    if (removingSourceId()) {
      return
    }

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

  return (
    <section class="space-y-6" aria-label="Notification settings">
      <div class="rounded-[2rem] border border-white/10 bg-card/80 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <p class="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Notifications</p>
        <h1 class="mt-3 text-2xl font-semibold tracking-tight text-foreground">RSS 기반 웹 푸시 관리</h1>
        <p class="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          RSS 피드를 구독하고, 현재 브라우저를 웹 푸시 수신 대상으로 등록할 수 있습니다. 같은 계정의 다른 브라우저 구독도
          서버 기준으로 함께 확인됩니다.
        </p>
      </div>

      <div class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div class="rounded-[2rem] border border-white/10 bg-card/80 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Web Push</p>
              <h2 class="mt-2 text-xl font-semibold text-foreground">현재 브라우저 알림 등록</h2>
              <p class="mt-2 text-sm leading-6 text-muted-foreground">
                브라우저 권한과 로컬 구독 상태, 서버에 저장된 구독 상태를 함께 확인합니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadPushData()}
              class="inline-flex items-center justify-center rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              새로고침
            </button>
          </div>

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

          <Show when={!pushLoading()} fallback={<p class="mt-6 text-sm text-muted-foreground">푸시 설정을 불러오는 중...</p>}>
            <div class="mt-6 grid gap-4 md:grid-cols-2">
              <div class="rounded-3xl border border-white/8 bg-black/20 p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">브라우저 권한</p>
                <p class="mt-2 text-lg font-semibold text-foreground">
                  {formatPermissionLabel(notificationPermission())}
                </p>
                <p class="mt-2 text-sm leading-6 text-muted-foreground">
                  {notificationPermission() === 'denied'
                    ? '브라우저 설정에서 이 사이트 알림 권한을 허용해야 등록할 수 있습니다.'
                    : pushPublicKeyAvailability() === 'unavailable'
                      ? '현재 서버에서는 푸시 알림 기능이 아직 설정되지 않았습니다.'
                    : '권한이 허용되면 현재 브라우저를 푸시 수신 대상으로 등록할 수 있습니다.'}
                </p>
              </div>

              <div class="rounded-3xl border border-white/8 bg-black/20 p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">현재 브라우저 상태</p>
                <p class="mt-2 text-lg font-semibold text-foreground">
                  {browserPushStatus().localSubscription ? '로컬 구독 있음' : '로컬 구독 없음'}
                </p>
                <p class="mt-2 text-sm leading-6 text-muted-foreground">
                  {browserPushStatus().serverHasCurrentBrowser
                    ? '서버에도 이 브라우저 구독이 저장되어 있습니다.'
                    : '서버에 아직 이 브라우저 구독이 저장되지 않았습니다.'}
                </p>
              </div>
            </div>

            <div class="mt-4 rounded-3xl border border-white/8 bg-black/20 p-4">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p class="text-sm font-semibold text-foreground">현재 브라우저 푸시 등록</p>
                  <p class="mt-1 text-sm text-muted-foreground">
                    서버 저장 구독 수 {pushSubscriptions().length}개
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
                    {pushBusy() ? '처리 중...' : '현재 브라우저 등록'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleUnsubscribeBrowser()}
                    disabled={pushBusy() || !browserPushStatus().localSubscription}
                    class="inline-flex items-center justify-center rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    현재 브라우저 해제
                  </button>
                </div>
              </div>

              <Show when={pushPublicKeyAvailability() === 'unavailable'}>
                <div class="mt-4 rounded-2xl border border-sky-400/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
                  현재 푸시 알림 기능이 아직 설정되지 않았습니다.
                </div>
              </Show>

              <Show when={browserPushStatus().localPayload}>
                {(payload) => (
                  <div class="mt-4 rounded-2xl border border-white/8 bg-background/40 px-4 py-3 text-sm text-muted-foreground">
                    <p class="font-medium text-foreground">로컬 엔드포인트</p>
                    <p class="mt-1 break-all">{payload().endpoint}</p>
                  </div>
                )}
              </Show>
            </div>

            <div class="mt-6">
              <h3 class="text-base font-semibold text-foreground">서버에 저장된 브라우저 구독</h3>
              <Show
                when={pushSubscriptions().length > 0}
                fallback={<p class="mt-3 text-sm text-muted-foreground">아직 저장된 브라우저 푸시 구독이 없습니다.</p>}
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
                          </div>
                        </div>
                      </article>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </Show>
        </div>

        <div class="rounded-[2rem] border border-white/10 bg-card/80 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.18em] text-accent">RSS Sources</p>
              <h2 class="mt-2 text-xl font-semibold text-foreground">RSS 구독 관리</h2>
              <p class="mt-2 text-sm leading-6 text-muted-foreground">
                RSS 피드 URL을 등록하면 새 항목 기준으로 웹 푸시를 받을 수 있습니다.
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
                {rssBusy() ? '추가 중...' : 'RSS 구독 추가'}
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

          <Show when={!rssLoading()} fallback={<p class="mt-6 text-sm text-muted-foreground">RSS 구독 목록을 불러오는 중...</p>}>
            <Show
              when={rssSources().length > 0}
              fallback={<p class="mt-6 text-sm text-muted-foreground">아직 등록한 RSS 구독이 없습니다.</p>}
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
                          {removingSourceId() === source.source_id ? '해제 중...' : '구독 해제'}
                        </button>
                      </div>
                    </article>
                  )}
                </For>
              </div>
            </Show>
          </Show>
        </div>
      </div>
    </section>
  )
}
