import { A } from '@solidjs/router'
import { For, Show, createEffect, createMemo, createSignal, onMount } from 'solid-js'
import { useAuth } from '../../../auth/AuthProvider'
import { createMatch, createMatchMessage, deleteMyMatch, fetchMatchMessages, fetchMyMatch, respondMatch } from '../api'
import { loadProfileDraft } from '../profileDraft'
import {
  buildProfileViewModel,
  buildTimelineEntries,
  formatMatchDateTime,
  getProfileToneClasses,
  getStatusBadgeClass,
  getStatusLabel,
  toProfileHref,
} from '../presentation'
import type { MatchMessage, MatchSummary } from '../types'

const MESSAGE_LIMIT = 140

export default function MatchPage() {
  const auth = useAuth()
  const [matchSummary, setMatchSummary] = createSignal<MatchSummary | null>(null)
  const [messages, setMessages] = createSignal<MatchMessage[]>([])
  const [targetUserId, setTargetUserId] = createSignal('')
  const [messageInput, setMessageInput] = createSignal('')
  const [loading, setLoading] = createSignal(true)
  const [messagesLoading, setMessagesLoading] = createSignal(false)
  const [submitting, setSubmitting] = createSignal(false)
  const [respondingAction, setRespondingAction] = createSignal<'accept' | 'reject' | null>(null)
  const [closingMatch, setClosingMatch] = createSignal(false)
  const [sendingMessage, setSendingMessage] = createSignal(false)
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null)
  const [successMessage, setSuccessMessage] = createSignal<string | null>(null)
  let messageStreamRef: HTMLDivElement | undefined

  const myUserId = createMemo(() => auth.session()?.user_id ?? '')
  const isRequester = createMemo(() => matchSummary()?.requester_user_id === myUserId())
  const isPendingTarget = createMemo(() => matchSummary()?.status === 'pending' && !isRequester())
  const canShowMessages = createMemo(() => matchSummary()?.status === 'matched')
  const trimmedMessageInput = createMemo(() => messageInput().trim())
  const remainingCharacters = createMemo(() => MESSAGE_LIMIT - messageInput().length)
  const canSendMessage = createMemo(() => canShowMessages() && !sendingMessage() && trimmedMessageInput().length > 0)
  const selfDraft = createMemo(() => loadProfileDraft(myUserId()) ?? undefined)
  const selfProfile = createMemo(() => buildProfileViewModel(myUserId() || 'me', myUserId(), selfDraft()))
  const counterpartProfile = createMemo(() => {
    const counterpartUserId = matchSummary()?.counterpart_user_id
    return counterpartUserId ? buildProfileViewModel(counterpartUserId, myUserId()) : null
  })
  const timelineEntries = createMemo(() => buildTimelineEntries(messages(), myUserId()))
  const lastMessage = createMemo(() => messages().at(-1) ?? null)
  const connectionDescription = createMemo(() => {
    const currentMatch = matchSummary()

    if (!currentMatch) {
      return '상대 사용자 ID를 입력하면 요청을 보내고, 수락 즉시 이 화면이 1:1 타임라인으로 바뀝니다.'
    }

    if (currentMatch.status === 'matched') {
      return '연결이 확정되었습니다. 프로필과 대화 흐름을 같은 화면에서 자연스럽게 오갈 수 있습니다.'
    }

    if (isPendingTarget()) {
      return '내가 응답하면 바로 타임라인이 열립니다. 수락 또는 거절을 선택하세요.'
    }

    return '상대가 이 요청을 확인하는 중입니다. 수락되면 아래 타임라인 composer가 활성화됩니다.'
  })

  createEffect(() => {
    messages()
    queueMicrotask(() => {
      if (!messageStreamRef) {
        return
      }

      messageStreamRef.scrollTo({
        top: messageStreamRef.scrollHeight,
        behavior: 'smooth',
      })
    })
  })

  const loadMatch = async () => {
    const nextMatch = await fetchMyMatch()
    setMatchSummary(nextMatch)
    return nextMatch
  }

  const loadMessages = async () => {
    if (!canShowMessages()) {
      setMessages([])
      return
    }

    setMessagesLoading(true)

    try {
      const response = await fetchMatchMessages()
      setMessages(response.messages)
    } finally {
      setMessagesLoading(false)
    }
  }

  const refreshPage = async () => {
    setErrorMessage(null)
    const nextMatch = await loadMatch()

    if (nextMatch?.status === 'matched') {
      await loadMessages()
      return
    }

    setMessages([])
  }

  onMount(() => {
    void refreshPage()
      .catch((error) => {
        setErrorMessage((error as Error).message)
      })
      .finally(() => {
        setLoading(false)
      })
  })

  const handleCreateMatch = async () => {
    if (submitting()) {
      return
    }

    const nextTargetUserId = targetUserId().trim()
    if (!nextTargetUserId) {
      setErrorMessage('상대 사용자 ID를 입력해 주세요.')
      setSuccessMessage(null)
      return
    }

    setSubmitting(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const created = await createMatch(nextTargetUserId)
      setMatchSummary(created)
      setTargetUserId('')
      setMessages([])
      setSuccessMessage('매칭 신청을 보냈어요.')
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRespond = async (action: 'accept' | 'reject') => {
    const currentMatch = matchSummary()
    if (!currentMatch || respondingAction()) {
      return
    }

    setRespondingAction(action)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const updated = await respondMatch(currentMatch.match_id, action)
      setMatchSummary(updated)
      setSuccessMessage(action === 'accept' ? '매칭을 수락했어요.' : '매칭을 거절했어요.')

      if (action === 'accept') {
        await loadMessages()
      } else {
        setMessages([])
      }
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setRespondingAction(null)
    }
  }

  const handleCloseMatch = async () => {
    if (closingMatch()) {
      return
    }

    const hadConfirmedMatch = canShowMessages()
    setClosingMatch(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      await deleteMyMatch()
      setMatchSummary(null)
      setMessages([])
      setMessageInput('')
      setSuccessMessage(hadConfirmedMatch ? '현재 연결을 해제했어요.' : '매칭 요청을 취소했어요.')
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setClosingMatch(false)
    }
  }

  const handleSendMessage = async () => {
    if (!canSendMessage()) {
      return
    }

    setSendingMessage(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const created = await createMatchMessage(trimmedMessageInput())
      setMessages((current) => [...current, created])
      setMessageInput('')
      setSuccessMessage('메시지를 보냈어요.')
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setSendingMessage(false)
    }
  }

  const handleMessageInput = (value: string) => {
    setMessageInput(value.slice(0, MESSAGE_LIMIT))
  }

  const handleComposerKeyDown = (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault()
      void handleSendMessage()
    }
  }

  return (
    <section class="page-enter">
      <Show when={errorMessage()}>
        {(message) => (
          <div class="border-b border-rose-500/25 px-1 py-3 text-sm text-rose-700 dark:text-rose-300">
            {message()}
          </div>
        )}
      </Show>

      <Show when={successMessage()}>
        {(message) => (
          <div class="border-b border-emerald-500/25 px-1 py-3 text-sm text-emerald-700 dark:text-emerald-300">
            {message()}
          </div>
        )}
      </Show>

      <Show
        when={!loading()}
        fallback={
          <div class="px-1 py-12 text-sm text-muted-foreground">
            불러오는 중…
          </div>
        }
      >
        <div>
          <Show
            when={matchSummary()}
            fallback={
              <div class="px-1 pb-4 pt-4">
                <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">1:1 timeline</p>
                <div class="mt-10 flex flex-col gap-4 sm:flex-row sm:items-end">
                  <label class="block min-w-0 flex-1 border-b border-border/80 pb-3">
                    <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      상대 사용자 ID
                    </span>
                    <input
                      type="text"
                      value={targetUserId()}
                      onInput={(event) => setTargetUserId(event.currentTarget.value)}
                      placeholder="예: bob@example.com"
                      class="w-full rounded-none bg-transparent px-0 py-2 text-base text-foreground outline-none placeholder:text-muted-foreground/80"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => void handleCreateMatch()}
                    disabled={submitting()}
                    class="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm font-semibold text-background transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting() ? '전송 중…' : '요청 보내기'}
                  </button>
                </div>
              </div>
            }
          >
            {(currentMatch) => (
              <header class="px-1 py-4">
                <div class="flex items-start gap-3">
                  <A
                    href={toProfileHref(currentMatch().counterpart_user_id)}
                    class={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getProfileToneClasses(counterpartProfile()?.tone ?? selfProfile().tone)} text-sm font-semibold text-foreground`}
                    aria-label={`${currentMatch().counterpart_user_id} 프로필`}
                  >
                    {counterpartProfile()?.initials ?? selfProfile().initials}
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
                        {lastMessage()
                          ? `${messages().length}개 메시지`
                          : formatMatchDateTime(currentMatch().created_at)}
                      </span>
                    </div>
                    <p class="mt-2 text-sm text-muted-foreground">{connectionDescription()}</p>
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
                      onClick={() => void handleCloseMatch()}
                      disabled={closingMatch()}
                      class="inline-flex h-9 items-center justify-center px-2 text-sm font-medium text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {closingMatch() ? '처리 중…' : currentMatch().status === 'matched' ? '연결 해제' : '요청 취소'}
                    </button>
                  </div>
                </div>

                <Show when={currentMatch().status === 'pending' && isPendingTarget()}>
                  <div class="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => void handleRespond('accept')}
                      disabled={respondingAction() !== null}
                      class="inline-flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-sm font-semibold text-background transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {respondingAction() === 'accept' ? '수락 중…' : '수락'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRespond('reject')}
                      disabled={respondingAction() !== null}
                      class="inline-flex h-10 items-center justify-center rounded-full border border-border/70 px-5 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {respondingAction() === 'reject' ? '거절 중…' : '거절'}
                    </button>
                  </div>
                </Show>
              </header>
            )}
          </Show>

          <Show
            when={canShowMessages()}
            fallback={
              <div class="px-1 py-8" />
            }
          >
            <div>
              <div ref={messageStreamRef} class="timeline-scrollbar max-h-[48rem] overflow-y-auto">
                <Show
                  when={!messagesLoading()}
                  fallback={<div class="px-1 py-6 text-sm text-muted-foreground">메시지를 불러오는 중…</div>}
                >
                  <Show
                    when={timelineEntries().length > 0}
                    fallback={<div class="px-1 py-10 text-sm text-muted-foreground">아직 오간 메시지가 없습니다. 첫 문장을 남겨보세요.</div>}
                  >
                    <For each={timelineEntries()}>
                      {(entry) =>
                        entry.type === 'day' ? (
                          <div class="sticky top-0 z-10 flex justify-center bg-background/92 py-4 backdrop-blur-md">
                            <span class="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              {entry.label}
                            </span>
                          </div>
                        ) : (
                          <article class="px-1 py-5">
                            <div class="flex items-start gap-3">
                              <A
                                href={toProfileHref(entry.message.sender_user_id)}
                                class={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                                  entry.isMine ? 'bg-foreground text-background' : 'bg-secondary text-foreground'
                                }`}
                                aria-label={`${entry.handle} 프로필`}
                              >
                                {entry.isMine ? 'ME' : buildProfileViewModel(entry.message.sender_user_id, myUserId()).initials}
                              </A>

                              <div class="min-w-0 flex-1">
                                <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                                  <A href={toProfileHref(entry.message.sender_user_id)} class="font-semibold text-foreground transition hover:text-primary">
                                    {entry.senderName}
                                  </A>
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
                  </Show>
                </Show>
              </div>

              <div class="sticky bottom-0 border-t border-border/70 bg-background/94 px-1 py-4 backdrop-blur-xl">
                <div class="flex items-start gap-3">
                  <A
                    href={toProfileHref(myUserId())}
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background"
                    aria-label={`${selfProfile().handle} 프로필`}
                  >
                    ME
                  </A>
                  <div class="min-w-0 flex-1">
                    <label class="block">
                      <span class="sr-only">메시지 남기기</span>
                      <textarea
                        rows="3"
                        maxLength={MESSAGE_LIMIT}
                        value={messageInput()}
                        onInput={(event) => handleMessageInput(event.currentTarget.value)}
                        onKeyDown={(event) => handleComposerKeyDown(event)}
                        placeholder="140자 이내로 짧게 남겨보세요."
                        class="w-full resize-none rounded-none bg-transparent px-0 py-1 text-[15px] text-foreground outline-none placeholder:text-muted-foreground/80"
                      />
                    </label>
                    <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div class={`text-sm ${remainingCharacters() <= 20 ? 'text-primary' : 'text-muted-foreground'}`}>
                        {remainingCharacters()}자 남음
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleSendMessage()}
                        disabled={!canSendMessage()}
                        class="inline-flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-sm font-semibold text-background transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {sendingMessage() ? '전송 중…' : '보내기'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Show>
        </div>
      </Show>
    </section>
  )
}
