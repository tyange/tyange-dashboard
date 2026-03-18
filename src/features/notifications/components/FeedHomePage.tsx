import { For, Show, createSignal, onMount } from 'solid-js'
import { fetchFeedItems, fetchPushPublicKeyState, fetchRssSources, fetchSavedPushSubscriptions } from '../api'
import type { FeedItemRecord } from '../types'

function formatFeedDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default function FeedHomePage() {
  const [items, setItems] = createSignal<FeedItemRecord[]>([])
  const [rssCount, setRssCount] = createSignal(0)
  const [unreadCount, setUnreadCount] = createSignal(0)
  const [notificationsEnabled, setNotificationsEnabled] = createSignal(false)
  const [loading, setLoading] = createSignal(true)
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null)

  onMount(() => {
    void Promise.all([
      fetchFeedItems(),
      fetchRssSources(),
      fetchPushPublicKeyState(),
      fetchSavedPushSubscriptions(),
    ])
      .then(([feedResponse, sources, publicKeyState, subscriptions]) => {
        setItems(feedResponse.items)
        setRssCount(sources.length)
        setUnreadCount(feedResponse.summary.unread_count)
        setNotificationsEnabled(publicKeyState.availability === 'available' && subscriptions.length > 0)
        setErrorMessage(null)
      })
      .catch((error) => {
        setErrorMessage((error as Error).message)
      })
      .finally(() => {
        setLoading(false)
      })
  })

  const statCell = 'rounded-2xl border border-border/70 bg-background/78 px-4 py-4'

  return (
    <section class="space-y-8 pb-10" aria-label="새 글">
      <header>
        <h1 class="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">새 글</h1>
      </header>

      <Show when={errorMessage()}>
        {(message) => (
          <div class="rounded-2xl border border-rose-400/30 bg-rose-500/8 px-4 py-3 text-sm text-rose-600">
            {message()}
          </div>
        )}
      </Show>

      <section class="border-b border-t border-border/70 py-5">
        <div class="grid gap-3 sm:grid-cols-3">
          <div class={statCell}>
            <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">구독</p>
            <p class="mt-2 text-3xl font-semibold text-foreground">{loading() ? '-' : `${rssCount()}개`}</p>
          </div>
          <div class={statCell}>
            <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">읽지 않음</p>
            <p class="mt-2 text-3xl font-semibold text-foreground">{loading() ? '-' : `${unreadCount()}개`}</p>
          </div>
          <div class={statCell}>
            <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">알림</p>
            <p class="mt-2 text-3xl font-semibold text-foreground">{notificationsEnabled() ? '켜짐' : '꺼짐'}</p>
          </div>
        </div>
      </section>

      <section class="border-t border-border/70 pt-8">
        <div class="mb-5">
          <h2 class="text-2xl font-semibold tracking-tight text-foreground">목록</h2>
        </div>

        <div class="overflow-x-auto rounded-[1.25rem] border border-border/70">
          <table class="min-w-full border-collapse text-left text-sm">
            <thead class="bg-secondary/65 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th class="px-4 py-3 font-medium">소스</th>
                <th class="px-4 py-3 font-medium">제목</th>
                <th class="px-4 py-3 font-medium">시각</th>
                <th class="px-4 py-3 font-medium">읽음</th>
                <th class="px-4 py-3 font-medium">저장</th>
              </tr>
            </thead>
            <tbody class="bg-card/65">
              <Show
                when={items().length > 0}
                fallback={
                  <tr>
                    <td colspan="5" class="px-4 py-8 text-center text-muted-foreground">
                      새 글이 없습니다.
                    </td>
                  </tr>
                }
              >
                <For each={items()}>
                  {(item) => (
                    <tr class="border-t border-border/60">
                      <td class="px-4 py-3 align-middle text-foreground">
                        <span class={item.read ? 'text-foreground' : 'font-semibold text-foreground'}>
                          {item.source_title}
                        </span>
                      </td>
                      <td class="px-4 py-3 align-middle text-foreground">
                        <Show
                          when={item.item_url}
                          fallback={<span>{item.title}</span>}
                        >
                          {(itemUrl) => (
                            <a href={itemUrl()} target="_blank" rel="noreferrer" class="hover:text-accent">
                              {item.title}
                            </a>
                          )}
                        </Show>
                      </td>
                      <td class="px-4 py-3 align-middle text-muted-foreground">{formatFeedDateTime(item.published_at)}</td>
                      <td class="px-4 py-3 align-middle">
                        <span
                          class={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            item.read
                              ? 'bg-secondary text-muted-foreground'
                              : 'bg-accent/14 text-accent'
                          }`}
                        >
                          {item.read ? '읽음' : '새 글'}
                        </span>
                      </td>
                      <td class="px-4 py-3 align-middle">
                        <span class="text-muted-foreground">{item.saved ? '저장됨' : '-'}</span>
                      </td>
                    </tr>
                  )}
                </For>
              </Show>
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}
