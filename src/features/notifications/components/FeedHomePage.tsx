import { For, Show, createMemo, createSignal, onMount } from 'solid-js'
import { fetchPushPublicKeyState, fetchRssSources, fetchSavedPushSubscriptions } from '../api'

type FeedItem = {
  source_title: string
  title: string
  published_at: string
  read: boolean
  saved: boolean
  item_url: string
}

const placeholderFeedItems: FeedItem[] = [
  {
    source_title: "Tyange's Blog",
    title: '알림 허브 UI를 정리하면서 바꾼 점들',
    published_at: '2026-03-19 09:20',
    read: false,
    saved: true,
    item_url: 'https://blog.tyange.com/posts/alert-hub-ui',
  },
  {
    source_title: "Tyange's Blog",
    title: 'RSS 구독 관리 화면을 더 단순하게 만드는 방법',
    published_at: '2026-03-18 17:40',
    read: false,
    saved: false,
    item_url: 'https://blog.tyange.com/posts/rss-subscription-ui',
  },
  {
    source_title: 'Product Notes',
    title: '설정 화면은 언제 별도 메뉴로 분리하는 게 좋을까',
    published_at: '2026-03-18 10:05',
    read: true,
    saved: false,
    item_url: 'https://example.com/product-notes/settings-split',
  },
  {
    source_title: 'Frontend Weekly',
    title: '테이블 중심 UI를 덜 딱딱하게 보이게 하는 디테일',
    published_at: '2026-03-17 08:30',
    read: true,
    saved: true,
    item_url: 'https://example.com/frontend-weekly/table-ui-details',
  },
]

export default function FeedHomePage() {
  const [rssCount, setRssCount] = createSignal(0)
  const [notificationsEnabled, setNotificationsEnabled] = createSignal(false)
  const [loading, setLoading] = createSignal(true)
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null)

  onMount(() => {
    void Promise.all([
      fetchRssSources(),
      fetchPushPublicKeyState(),
      fetchSavedPushSubscriptions(),
    ])
      .then(([sources, publicKeyState, subscriptions]) => {
        setRssCount(sources.length)
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

  const unreadCount = createMemo(() => placeholderFeedItems.filter((item) => !item.read).length)
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
            <p class="mt-2 text-3xl font-semibold text-foreground">{placeholderFeedItems.length > 0 ? unreadCount() : 0}개</p>
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

        <div class="mb-4 rounded-2xl border border-sky-400/24 bg-sky-500/8 px-4 py-3 text-sm text-sky-700">
          검토용 더미 데이터입니다. 실제 새 글 API가 연결되면 이 목록은 서버 데이터로 교체됩니다.
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
                when={placeholderFeedItems.length > 0}
                fallback={
                  <tr>
                    <td colspan="5" class="px-4 py-8 text-center text-muted-foreground">
                      새 글이 없습니다.
                    </td>
                  </tr>
                }
              >
                <For each={placeholderFeedItems}>
                  {(item) => (
                    <tr class="border-t border-border/60">
                      <td class="px-4 py-3 align-middle text-foreground">
                        <span class={item.read ? 'text-foreground' : 'font-semibold text-foreground'}>
                          {item.source_title}
                        </span>
                      </td>
                      <td class="px-4 py-3 align-middle text-foreground">
                        <a href={item.item_url} target="_blank" rel="noreferrer" class="hover:text-accent">
                          {item.title}
                        </a>
                      </td>
                      <td class="px-4 py-3 align-middle text-muted-foreground">{item.published_at}</td>
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
