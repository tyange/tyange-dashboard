import { For, Show, createMemo, createSignal, onMount } from 'solid-js'
import { useAuth } from '../../../auth/AuthProvider'
import { createMatch, createMatchMessage, deleteMyMatch, fetchMatchMessages, fetchMyMatch, respondMatch } from '../api'
import type { MatchMessage, MatchSummary } from '../types'

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return '없음'
  }

  const date = new Date(value.replace(' ', 'T'))

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

function statusBadgeClass(status: string) {
  switch (status) {
    case 'matched':
      return 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/30'
    case 'pending':
      return 'bg-amber-500/15 text-amber-100 border border-amber-400/30'
    default:
      return 'bg-white/8 text-white/70 border border-white/10'
  }
}

function statusLabel(status: string) {
  if (status === 'matched') {
    return '연결됨'
  }

  if (status === 'pending') {
    return '응답 대기'
  }

  return status
}

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

  const myUserId = createMemo(() => auth.session()?.user_id ?? '')
  const isRequester = createMemo(() => matchSummary()?.requester_user_id === myUserId())
  const isPendingTarget = createMemo(() => matchSummary()?.status === 'pending' && !isRequester())
  const canShowMessages = createMemo(() => matchSummary()?.status === 'matched')

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
    if (sendingMessage()) {
      return
    }

    const content = messageInput().trim()
    if (!content) {
      setErrorMessage('메시지 내용을 입력해 주세요.')
      setSuccessMessage(null)
      return
    }

    setSendingMessage(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const created = await createMatchMessage(content)
      setMessages((current) => [...current, created])
      setMessageInput('')
      setSuccessMessage('메시지를 보냈어요.')
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setSendingMessage(false)
    }
  }

  return (
    <section class="space-y-6 pb-10">
      <div class="relative overflow-hidden rounded-[2rem] border border-white/10 bg-card/80 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div class="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_right,rgba(91,168,255,0.24),transparent_48%),radial-gradient(circle_at_top_left,rgba(74,222,128,0.18),transparent_36%)]" />
        <div class="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-2xl">
            <p class="text-sm font-semibold uppercase tracking-[0.18em] text-accent">1:1 Match</p>
            <h1 class="mt-3 text-3xl font-semibold tracking-tight text-foreground">1:1 트윗 상대 연결</h1>
            <p class="mt-3 text-sm leading-6 text-muted-foreground">
              사용자 ID 기준으로 상대를 지정해 연결하고, 연결이 확정되면 짧은 메시지를 주고받을 수 있어요.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setLoading(true)
              void refreshPage()
                .catch((error) => {
                  setErrorMessage((error as Error).message)
                })
                .finally(() => {
                  setLoading(false)
                })
            }}
            class="inline-flex items-center justify-center rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            새로고침
          </button>
        </div>

        <Show when={errorMessage()}>
          {(message) => (
            <div class="relative mt-5 rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {message()}
            </div>
          )}
        </Show>

        <Show when={successMessage()}>
          {(message) => (
            <div class="relative mt-5 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {message()}
            </div>
          )}
        </Show>
      </div>

      <Show when={!loading()} fallback={<div class="rounded-[2rem] border border-white/10 bg-card/80 p-6 text-sm text-muted-foreground">불러오는 중…</div>}>
        <div class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div class="space-y-6">
            <Show
              when={matchSummary()}
              fallback={
                <div class="rounded-[2rem] border border-white/10 bg-card/80 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
                  <h2 class="text-xl font-semibold text-foreground">새 상대 지정</h2>
                  <p class="mt-2 text-sm leading-6 text-muted-foreground">
                    연결하려는 사용자 ID를 입력하면 상대에게 1:1 요청이 전송됩니다.
                  </p>

                  <div class="mt-6 rounded-3xl border border-white/8 bg-black/20 p-4">
                    <label class="block">
                      <span class="mb-2 block text-sm font-medium text-foreground">상대 사용자 ID</span>
                      <input
                        type="text"
                        value={targetUserId()}
                        onInput={(event) => setTargetUserId(event.currentTarget.value)}
                        placeholder="예: bob@example.com"
                        class="w-full rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
                      />
                    </label>
                    <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p class="text-xs leading-5 text-muted-foreground">동시에 한 건의 활성 요청 또는 연결만 유지할 수 있어요.</p>
                      <button
                        type="button"
                        onClick={() => void handleCreateMatch()}
                        disabled={submitting()}
                        class="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submitting() ? '전송 중…' : '매칭 신청'}
                      </button>
                    </div>
                  </div>
                </div>
              }
            >
              {(currentMatch) => (
                <div class="rounded-[2rem] border border-white/10 bg-card/80 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
                  <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div class="flex items-center gap-3">
                        <h2 class="text-xl font-semibold text-foreground">현재 상태</h2>
                        <span class={`rounded-full px-3 py-1 text-xs font-semibold tracking-[0.14em] ${statusBadgeClass(currentMatch().status)}`}>
                          {statusLabel(currentMatch().status)}
                        </span>
                      </div>
                      <p class="mt-2 text-sm text-muted-foreground">
                        상대: <span class="font-medium text-foreground">{currentMatch().counterpart_user_id}</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleCloseMatch()}
                      disabled={closingMatch()}
                      class="inline-flex items-center justify-center rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {closingMatch()
                        ? '처리 중…'
                        : currentMatch().status === 'matched'
                          ? '연결 해제'
                          : '요청 취소'}
                    </button>
                  </div>

                  <div class="mt-6 grid gap-3 sm:grid-cols-3">
                    <div class="rounded-3xl border border-white/8 bg-black/20 p-4">
                      <p class="text-xs uppercase tracking-[0.16em] text-white/45">내 역할</p>
                      <p class="mt-2 text-sm font-medium text-foreground">{isRequester() ? '신청자' : '응답자'}</p>
                    </div>
                    <div class="rounded-3xl border border-white/8 bg-black/20 p-4">
                      <p class="text-xs uppercase tracking-[0.16em] text-white/45">요청 시각</p>
                      <p class="mt-2 text-sm font-medium text-foreground">{formatDateTime(currentMatch().created_at)}</p>
                    </div>
                    <div class="rounded-3xl border border-white/8 bg-black/20 p-4">
                      <p class="text-xs uppercase tracking-[0.16em] text-white/45">응답 시각</p>
                      <p class="mt-2 text-sm font-medium text-foreground">{formatDateTime(currentMatch().responded_at)}</p>
                    </div>
                  </div>

                  <Show when={currentMatch().status === 'pending'}>
                    <div class="mt-6 rounded-3xl border border-amber-400/20 bg-amber-500/8 p-4">
                      <Show
                        when={isPendingTarget()}
                        fallback={
                          <div>
                            <p class="text-sm font-semibold text-amber-100">상대 응답 대기 중</p>
                            <p class="mt-2 text-sm leading-6 text-amber-50/80">
                              상대가 수락하면 바로 메시지 타임라인이 열립니다.
                            </p>
                          </div>
                        }
                      >
                        <div class="space-y-4">
                          <div>
                            <p class="text-sm font-semibold text-amber-100">이 요청에 응답할 차례예요.</p>
                            <p class="mt-2 text-sm leading-6 text-amber-50/80">
                              수락하면 1:1 메시지를 주고받을 수 있고, 거절하면 이 요청은 종료됩니다.
                            </p>
                          </div>
                          <div class="flex flex-col gap-3 sm:flex-row">
                            <button
                              type="button"
                              onClick={() => void handleRespond('accept')}
                              disabled={respondingAction() !== null}
                              class="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {respondingAction() === 'accept' ? '수락 중…' : '수락'}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleRespond('reject')}
                              disabled={respondingAction() !== null}
                              class="inline-flex items-center justify-center rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {respondingAction() === 'reject' ? '거절 중…' : '거절'}
                            </button>
                          </div>
                        </div>
                      </Show>
                    </div>
                  </Show>
                </div>
              )}
            </Show>
          </div>

          <div class="rounded-[2rem] border border-white/10 bg-card/80 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Timeline</p>
                <h2 class="mt-2 text-xl font-semibold text-foreground">1:1 메시지</h2>
              </div>
              <Show when={canShowMessages()}>
                <button
                  type="button"
                  onClick={() => void loadMessages().catch((error) => setErrorMessage((error as Error).message))}
                  class="inline-flex items-center justify-center rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  새로고침
                </button>
              </Show>
            </div>

            <Show
              when={canShowMessages()}
              fallback={
                <div class="mt-6 rounded-3xl border border-white/8 bg-black/20 p-5 text-sm leading-6 text-muted-foreground">
                  연결이 확정되면 여기서 상대와 짧은 메시지를 주고받을 수 있어요.
                </div>
              }
            >
              <div class="mt-6 space-y-4">
                <div class="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                  <Show
                    when={!messagesLoading()}
                    fallback={<div class="rounded-3xl border border-white/8 bg-black/20 p-4 text-sm text-muted-foreground">메시지를 불러오는 중…</div>}
                  >
                    <Show
                      when={messages().length > 0}
                      fallback={<div class="rounded-3xl border border-white/8 bg-black/20 p-4 text-sm text-muted-foreground">아직 오간 메시지가 없어요.</div>}
                    >
                      <For each={messages()}>
                        {(message) => {
                          const mine = () => message.sender_user_id === myUserId()

                          return (
                            <div class={`flex ${mine() ? 'justify-end' : 'justify-start'}`}>
                              <article
                                class={`max-w-[88%] rounded-[1.6rem] border px-4 py-3 ${
                                  mine()
                                    ? 'border-sky-400/30 bg-sky-500/14 text-sky-50'
                                    : 'border-white/10 bg-black/20 text-white'
                                }`}
                              >
                                <div class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55">
                                  <span>{mine() ? '나' : message.sender_user_id}</span>
                                  <span>•</span>
                                  <span>{formatDateTime(message.created_at)}</span>
                                </div>
                                <p class="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p>
                              </article>
                            </div>
                          )
                        }}
                      </For>
                    </Show>
                  </Show>
                </div>

                <div class="rounded-3xl border border-white/8 bg-black/20 p-4">
                  <label class="block">
                    <span class="mb-2 block text-sm font-medium text-foreground">메시지 남기기</span>
                    <textarea
                      rows="4"
                      value={messageInput()}
                      onInput={(event) => setMessageInput(event.currentTarget.value)}
                      placeholder="상대에게 짧게 남길 내용을 적어 주세요."
                      class="w-full resize-none rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
                    />
                  </label>
                  <div class="mt-4 flex items-center justify-between gap-3">
                    <p class="text-xs leading-5 text-muted-foreground">현재 연결된 상대에게만 바로 전달됩니다.</p>
                    <button
                      type="button"
                      onClick={() => void handleSendMessage()}
                      disabled={sendingMessage()}
                      class="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {sendingMessage() ? '전송 중…' : '보내기'}
                    </button>
                  </div>
                </div>
              </div>
            </Show>
          </div>
        </div>
      </Show>
    </section>
  )
}
