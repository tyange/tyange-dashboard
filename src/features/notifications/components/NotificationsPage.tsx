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

  const handleAddRssSource = async () => {
    if (rssBusy()) return

    const feedUrl = rssInput().trim()
    if (!feedUrl) {
      setRssErrorMessage('RSS 주소를 입력해주세요.')
      setRssSuccessMessage(null)
      return
    }

    setRssBusy(true)
    setRssErrorMessage(null)
    setRssSuccessMessage(null)

    try {
      await subscribeRssSource(feedUrl)
      setRssInput('')
      setRssSuccessMessage('구독을 추가했습니다.')
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
      setRssSuccessMessage('구독을 해제했습니다.')
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
            </div>
          )}
        </Show>

        <Show when={rssSuccessMessage()}>
          {(message) => (
            <div class="mb-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-600">
              {message()}
            </div>
          )}
        </Show>

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
        </div>
      </section>
    </section>
  )
}
