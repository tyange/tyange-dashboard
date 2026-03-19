import { For, Show, createMemo, createSignal, onMount } from 'solid-js'
import {
  deletePushSubscription,
  fetchPushPublicKeyState,
  fetchSavedPushSubscriptions,
  savePushSubscription,
} from '../api'
import {
  getCurrentPushSubscription,
  getNotificationPermissionState,
  getPushSupportState,
  requestNotificationPermission,
  subscribeCurrentBrowser,
  toPushSubscriptionPayload,
} from '../push'
import { reconcileBrowserPushStatus } from '../reconcile'
import type {
  PushPublicKeyAvailability,
  SavedPushSubscriptionRecord,
} from '../types'

type BrowserAlertsSettingsSectionProps = {
  title?: string
  showTechnicalDetails?: boolean
}

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
  return '선택 전'
}

function summarizeEndpoint(endpoint: string) {
  if (endpoint.length <= 56) return endpoint
  return `${endpoint.slice(0, 24)}...${endpoint.slice(-24)}`
}

function buildPushSectionError(errors: string[]) {
  const messages = errors.filter(Boolean)
  return messages.length > 0 ? messages.join(' ') : null
}

function syncStatusLabel(
  availability: PushPublicKeyAvailability,
  currentBrowserRegistered: boolean,
  supported: boolean,
) {
  if (availability === 'unavailable') return '서버 준비 중'
  if (!supported) return '지원 안 됨'
  return currentBrowserRegistered ? '이 브라우저 등록됨' : '등록 안 됨'
}

export default function BrowserAlertsSettingsSection(props: BrowserAlertsSettingsSectionProps) {
  const pushSupport = getPushSupportState()
  const [pushPublicKey, setPushPublicKey] = createSignal<string | null>(null)
  const [pushPublicKeyAvailability, setPushPublicKeyAvailability] =
    createSignal<PushPublicKeyAvailability>('available')
  const [pushSubscriptions, setPushSubscriptions] = createSignal<SavedPushSubscriptionRecord[]>([])
  const [localPushSubscription, setLocalPushSubscription] = createSignal<PushSubscription | null>(null)
  const [notificationPermission, setNotificationPermission] =
    createSignal<NotificationPermission>(getNotificationPermissionState())
  const [pushLoading, setPushLoading] = createSignal(true)
  const [pushBusy, setPushBusy] = createSignal(false)
  const [pushErrorMessage, setPushErrorMessage] = createSignal<string | null>(null)
  const [pushSuccessMessage, setPushSuccessMessage] = createSignal<string | null>(null)

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

  onMount(() => {
    void loadPushData()
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
        throw new Error('브라우저 설정에서 이 사이트 알림 권한을 허용한 뒤 다시 시도해주세요.')
      }

      if (permission !== 'granted') {
        throw new Error('알림 권한을 허용해야 이 브라우저를 등록할 수 있습니다.')
      }

      const publicKey = pushPublicKey()
      if (!publicKey) {
        throw new Error('푸시 공개 키를 아직 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
      }

      const currentStatus = browserPushStatus()
      if (currentStatus.localPayload && currentStatus.serverHasCurrentBrowser) {
        setPushSuccessMessage('이 브라우저는 이미 등록되어 있습니다.')
        return
      }

      const subscription = await subscribeCurrentBrowser(publicKey)
      await savePushSubscription(toPushSubscriptionPayload(subscription))

      setPushSuccessMessage('이 브라우저 알림을 등록했습니다.')
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
      setPushErrorMessage('이 브라우저에 등록된 알림이 없습니다.')
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
          failures.push('브라우저 등록 해제에 실패했습니다.')
        }
      } catch (error) {
        failures.push(`브라우저 해제 오류: ${(error as Error).message}`)
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

      setPushSuccessMessage('이 브라우저 알림을 해제했습니다.')
    } finally {
      setPushBusy(false)
    }
  }

  const ghostButton =
    'inline-flex h-11 items-center justify-center rounded-full border border-border/70 bg-card/82 px-4 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60'
  const primaryButton =
    'inline-flex h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-60'
  const statCell = 'rounded-2xl border border-border/70 bg-background/78 px-4 py-4'

  return (
    <section class="pt-8">
      <div class="flex items-end justify-between gap-4">
        <h2 class="text-2xl font-semibold tracking-tight text-foreground">
          {props.title ?? '현재 브라우저 알림'}
        </h2>
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

      <Show when={!pushLoading()} fallback={<p class="mt-6 text-sm text-muted-foreground">알림 상태를 불러오는 중...</p>}>
        <div class="mt-6 space-y-4">
          <div class="grid gap-3 md:grid-cols-3">
            <div class={statCell}>
              <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">권한</p>
              <p class="mt-2 text-2xl font-semibold text-foreground">{formatPermissionLabel(notificationPermission())}</p>
            </div>
            <div class={statCell}>
              <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">상태</p>
              <p class="mt-2 text-2xl font-semibold text-foreground">
                {syncStatusLabel(
                  pushPublicKeyAvailability(),
                  browserPushStatus().serverHasCurrentBrowser,
                  pushSupport.supported,
                )}
              </p>
            </div>
            <div class={statCell}>
              <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">서버 저장</p>
              <p class="mt-2 text-2xl font-semibold text-foreground">{pushSubscriptions().length}개</p>
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
              {pushBusy() ? '처리 중...' : '이 브라우저 등록'}
            </button>
            <button
              type="button"
              onClick={() => void handleUnsubscribeBrowser()}
              disabled={pushBusy() || !browserPushStatus().localSubscription}
              class={ghostButton}
            >
              이 브라우저 해제
            </button>
          </div>

          <Show when={pushPublicKeyAvailability() === 'unavailable'}>
            <div class="rounded-2xl border border-sky-400/24 bg-sky-500/8 px-4 py-3 text-sm text-sky-700">
              서버 알림 기능이 아직 준비되지 않았습니다.
            </div>
          </Show>

          <Show when={props.showTechnicalDetails}>
            <details class="rounded-[1.25rem] border border-border/70 bg-card/65">
              <summary class="cursor-pointer px-4 py-3 text-sm font-medium text-foreground">
                고급 정보 보기
              </summary>
              <div class="px-4 py-4">
                <Show when={browserPushStatus().localPayload}>
                  {(payload) => (
                    <div class="rounded-2xl border border-border/70 bg-background/82 px-4 py-3 text-sm text-muted-foreground">
                      <p class="font-medium text-foreground">로컬 엔드포인트</p>
                      <p class="mt-1 break-all">{payload().endpoint}</p>
                    </div>
                  )}
                </Show>

                <div class="mt-4 overflow-x-auto rounded-[1rem] border border-border/70">
                  <table class="min-w-full border-collapse text-left text-sm">
                    <thead class="bg-secondary/65 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      <tr>
                        <th class="px-4 py-3 font-medium">엔드포인트</th>
                        <th class="px-4 py-3 font-medium">상태</th>
                        <th class="px-4 py-3 font-medium">생성일</th>
                        <th class="px-4 py-3 font-medium">수정일</th>
                      </tr>
                    </thead>
                    <tbody class="bg-card/65">
                      <Show
                        when={pushSubscriptions().length > 0}
                        fallback={
                          <tr>
                            <td colspan="4" class="px-4 py-4 text-muted-foreground">
                              저장된 브라우저 알림이 없습니다.
                            </td>
                          </tr>
                        }
                      >
                        <For each={pushSubscriptions()}>
                          {(subscription) => (
                            <tr class="border-t border-border/60">
                              <td class="px-4 py-3 align-middle text-foreground">
                                {summarizeEndpoint(subscription.endpoint)}
                              </td>
                              <td class="px-4 py-3 align-middle">
                                <Show
                                  when={browserPushStatus().matchedServerSubscription?.endpoint === subscription.endpoint}
                                  fallback={<span class="text-muted-foreground">사용 중</span>}
                                >
                                  <span class="rounded-full bg-emerald-500/14 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                    이 브라우저
                                  </span>
                                </Show>
                              </td>
                              <td class="px-4 py-3 align-middle text-muted-foreground">
                                {formatDateTime(subscription.created_at)}
                              </td>
                              <td class="px-4 py-3 align-middle text-muted-foreground">
                                {formatDateTime(subscription.updated_at)}
                              </td>
                            </tr>
                          )}
                        </For>
                      </Show>
                    </tbody>
                  </table>
                </div>
              </div>
            </details>
          </Show>
        </div>
      </Show>
    </section>
  )
}
