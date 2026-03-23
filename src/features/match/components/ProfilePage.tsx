import { A, useParams } from '@solidjs/router'
import { For, Show, createMemo, createSignal, onMount } from 'solid-js'
import { useAuth } from '../../../auth/AuthProvider'
import { fetchMatchMessages, fetchMyMatch } from '../api'
import {
  buildProfileViewModel,
  buildRelationshipState,
  buildTimelineEntries,
  getProfileToneClasses,
  getRelationshipBadgeClass,
  toProfileHref,
} from '../presentation'
import type { MatchMessage, MatchSummary } from '../types'

function decodeRouteUserId(value: string | undefined) {
  if (!value) {
    return ''
  }

  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export default function ProfilePage() {
  const auth = useAuth()
  const params = useParams<{ userId: string }>()
  const [loading, setLoading] = createSignal(true)
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null)
  const [matchSummary, setMatchSummary] = createSignal<MatchSummary | null>(null)
  const [messages, setMessages] = createSignal<MatchMessage[]>([])

  const myUserId = createMemo(() => auth.session()?.user_id ?? '')
  const profileUserId = createMemo(() => decodeRouteUserId(params.userId))
  const profile = createMemo(() =>
    buildProfileViewModel(
      profileUserId(),
      myUserId(),
      profileUserId() === myUserId()
        ? {
            displayName: auth.session()?.display_name,
            avatarUrl: auth.session()?.avatar_url,
            bio: auth.session()?.bio,
          }
        : undefined,
    ),
  )
  const relationship = createMemo(() => buildRelationshipState(matchSummary(), myUserId(), profileUserId()))
  const isSelf = createMemo(() => profileUserId() === myUserId())
  const isActiveCounterpart = createMemo(() => matchSummary()?.counterpart_user_id === profileUserId())
  const timelinePreview = createMemo(() => buildTimelineEntries(messages().slice(-6), myUserId()))

  onMount(() => {
    void fetchMyMatch()
      .then(async (nextMatch) => {
        setMatchSummary(nextMatch)

        if (nextMatch?.status === 'matched') {
          const response = await fetchMatchMessages()
          setMessages(response.messages)
        }
      })
      .catch((error) => {
        setErrorMessage((error as Error).message)
      })
      .finally(() => {
        setLoading(false)
      })
  })

  return (
    <section class="page-enter space-y-5 px-1 sm:space-y-6">
      <div class="flex items-center justify-between gap-3">
        <A
          href="/dashboard"
          class="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <span aria-hidden="true">←</span>
          타임라인으로
        </A>
      </div>

      <Show when={errorMessage()}>
        {(message) => (
          <div class="px-1 py-3 text-sm text-rose-700 dark:text-rose-300">
            {message()}
          </div>
        )}
      </Show>

      <Show
        when={!loading()}
        fallback={
          <div class="py-12 text-sm text-muted-foreground">
            프로필을 불러오는 중…
          </div>
        }
      >
        <div>
          <header class="pb-6">
            <div class="flex items-start gap-4">
              <Show
                when={profile().avatarUrl}
                fallback={
                  <div
                    class={`flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${getProfileToneClasses(profile().tone)} text-lg font-semibold text-foreground`}
                  >
                    {profile().initials}
                  </div>
                }
              >
                {(avatarUrl) => <img src={avatarUrl()} alt="" class="h-16 w-16 rounded-full object-cover" />}
              </Show>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <h1 class="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{profile().displayName}</h1>
                  <span
                    class={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getRelationshipBadgeClass(relationship().kind)}`}
                  >
                    {relationship().label}
                  </span>
                </div>
                <p class="mt-2 text-sm text-muted-foreground">{profile().handle}</p>
                <p class="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{profile().bio}</p>
              </div>
            </div>
          </header>

          <div class="py-5">
            <p class="text-sm text-muted-foreground">{relationship().description}</p>
          </div>

          <div class="py-5">
            <h2 class="text-base font-semibold tracking-tight text-foreground">최근 대화</h2>

            <Show
              when={isActiveCounterpart() && messages().length > 0}
              fallback={
                <Show
                  when={isSelf() && matchSummary()}
                  fallback={<p class="mt-4 text-sm text-muted-foreground">현재 이 프로필에 연결된 대화가 없습니다.</p>}
                >
                  {(currentMatch) => (
                    <div class="mt-4">
                      <p class="text-sm text-muted-foreground">현재 연결된 상대</p>
                      <A
                        href={toProfileHref(currentMatch().counterpart_user_id)}
                        class="mt-2 inline-flex items-center text-base font-semibold text-foreground transition hover:text-primary"
                      >
                        @{currentMatch().counterpart_user_id}
                      </A>
                    </div>
                  )}
                </Show>
              }
            >
              <div class="mt-4">
                <For each={timelinePreview()}>
                  {(entry) =>
                    entry.type === 'day' ? (
                      <div class="py-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {entry.label}
                      </div>
                    ) : (
                      <article class="py-4">
                        <div class="flex items-start gap-3">
                          <Show
                            when={entry.message.sender_user_id === myUserId() && profile().avatarUrl}
                            fallback={
                              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-foreground">
                                {entry.message.sender_user_id === myUserId()
                                  ? 'ME'
                                  : buildProfileViewModel(entry.message.sender_user_id, myUserId()).initials}
                              </div>
                            }
                          >
                            {(avatarUrl) => <img src={avatarUrl()} alt="" class="h-10 w-10 rounded-full object-cover" />}
                          </Show>
                          <div class="min-w-0 flex-1">
                            <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                              <span class="font-semibold text-foreground">{entry.senderName}</span>
                              <span class="text-muted-foreground">{entry.handle}</span>
                              <span class="text-muted-foreground">·</span>
                              <span class="text-muted-foreground">{entry.displayTime}</span>
                            </div>
                            <p class="mt-2 whitespace-pre-wrap break-words text-[15px] leading-7 text-foreground">
                              {entry.message.content}
                            </p>
                          </div>
                        </div>
                      </article>
                    )
                  }
                </For>
              </div>
            </Show>
          </div>
        </div>
      </Show>
    </section>
  )
}
