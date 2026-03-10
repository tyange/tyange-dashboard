import { For, Show, createSignal, onMount } from 'solid-js'
import { createApiKey, fetchApiKeys, revokeApiKey } from '../api'
import type { ApiKeyRecord } from '../types'

function formatDateTime(value: string | null) {
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

function isRevoked(record: ApiKeyRecord) {
  return Boolean(record.revoked_at)
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = createSignal<ApiKeyRecord[]>([])
  const [nameInput, setNameInput] = createSignal('')
  const [loading, setLoading] = createSignal(true)
  const [creating, setCreating] = createSignal(false)
  const [revokingId, setRevokingId] = createSignal<number | null>(null)
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null)
  const [successMessage, setSuccessMessage] = createSignal<string | null>(null)
  const [issuedApiKey, setIssuedApiKey] = createSignal<string | null>(null)
  const [copyMessage, setCopyMessage] = createSignal<string | null>(null)

  const loadApiKeys = async () => {
    const result = await fetchApiKeys()
    setApiKeys(result.api_keys)
  }

  onMount(() => {
    void loadApiKeys()
      .catch((error) => {
        setErrorMessage((error as Error).message)
      })
      .finally(() => {
        setLoading(false)
      })
  })

  const handleCreate = async () => {
    if (creating()) {
      return
    }

    const name = nameInput().trim()
    if (!name) {
      setErrorMessage('API 키 이름을 입력해주세요.')
      setSuccessMessage(null)
      setIssuedApiKey(null)
      return
    }

    setCreating(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    setIssuedApiKey(null)
    setCopyMessage(null)

    try {
      const created = await createApiKey(name)
      setNameInput('')
      setIssuedApiKey(created.api_key)
      setSuccessMessage(`API 키 "${created.name}"를 발급했습니다.`)
      await loadApiKeys()
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (apiKeyId: number) => {
    if (revokingId() !== null) {
      return
    }

    setRevokingId(apiKeyId)
    setErrorMessage(null)
    setSuccessMessage(null)
    setIssuedApiKey(null)
    setCopyMessage(null)

    try {
      await revokeApiKey(apiKeyId)
      setSuccessMessage('API 키를 폐기했습니다.')
      await loadApiKeys()
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setRevokingId(null)
    }
  }

  const handleCopy = async () => {
    const apiKey = issuedApiKey()
    if (!apiKey) {
      return
    }

    try {
      await navigator.clipboard.writeText(apiKey)
      setCopyMessage('복사했습니다.')
    } catch {
      setCopyMessage('클립보드 복사에 실패했습니다.')
    }
  }

  return (
    <section class="space-y-6">
      <div class="rounded-[2rem] border border-white/10 bg-card/80 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <p class="text-sm font-semibold uppercase tracking-[0.18em] text-accent">API Keys</p>
        <h1 class="mt-3 text-2xl font-semibold tracking-tight text-foreground">유저별 API 키 발급</h1>
        <p class="mt-3 text-sm leading-6 text-muted-foreground">
          로그인한 사용자 기준으로 API 키를 발급합니다. 원문 키는 발급 직후 한 번만 표시되므로 바로 복사해두세요.
        </p>

        <div class="mt-6 rounded-3xl border border-white/8 bg-black/20 p-4">
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-foreground">API 키 이름</span>
            <input
              type="text"
              value={nameInput()}
              onInput={(event) => setNameInput(event.currentTarget.value)}
              placeholder="예: macrodroid-main-phone"
              class="w-full rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
            />
          </label>

          <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-xs leading-5 text-muted-foreground">
              `POST /budget/spending` 호출 시 `X-API-Key` 헤더로 사용할 수 있습니다.
            </p>
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={creating()}
              class="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating() ? '발급 중...' : 'API 키 발급'}
            </button>
          </div>
        </div>

        <Show when={errorMessage()}>
          {(message) => (
            <div class="mt-4 rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {message()}
            </div>
          )}
        </Show>

        <Show when={successMessage()}>
          {(message) => (
            <div class="mt-4 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {message()}
            </div>
          )}
        </Show>

        <Show when={issuedApiKey()}>
          {(apiKey) => (
            <div class="mt-4 rounded-3xl border border-sky-400/30 bg-sky-500/10 p-4">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p class="text-sm font-semibold text-sky-100">이번 한 번만 표시되는 API 키</p>
                  <p class="mt-2 break-all rounded-2xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm text-white">
                    {apiKey()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  class="inline-flex shrink-0 whitespace-nowrap items-center justify-center rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  복사
                </button>
              </div>
              <p class="mt-3 text-xs leading-5 text-sky-100/80">
                목록 화면에서는 보안상 원문을 다시 보여주지 않습니다.
                <Show when={copyMessage()}>
                  {(message) => <span class="ml-2 text-white">{message()}</span>}
                </Show>
              </p>
            </div>
          )}
        </Show>
      </div>

      <div class="rounded-[2rem] border border-white/10 bg-card/80 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-foreground">발급된 키 목록</h2>
            <p class="mt-1 text-sm text-muted-foreground">현재 로그인한 유저가 만든 키만 표시됩니다.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setLoading(true)
              setErrorMessage(null)
              void loadApiKeys()
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

        <Show when={!loading()} fallback={<p class="mt-6 text-sm text-muted-foreground">목록을 불러오는 중...</p>}>
          <Show
            when={apiKeys().length > 0}
            fallback={<p class="mt-6 text-sm text-muted-foreground">아직 발급된 API 키가 없습니다.</p>}
          >
            <div class="mt-6 space-y-4">
              <For each={apiKeys()}>
                {(record) => (
                  <article class="rounded-3xl border border-white/8 bg-black/20 p-4">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div class="min-w-0">
                        <div class="flex items-center gap-2">
                          <h3 class="truncate text-base font-semibold text-foreground">{record.name}</h3>
                          <span
                            class={`rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] ${
                              isRevoked(record)
                                ? 'bg-rose-500/15 text-rose-200'
                                : 'bg-emerald-500/15 text-emerald-200'
                            }`}
                          >
                            {isRevoked(record) ? 'REVOKED' : 'ACTIVE'}
                          </span>
                        </div>
                        <dl class="mt-3 grid gap-2 text-sm text-muted-foreground">
                          <div>
                            <dt class="font-medium text-foreground">생성일</dt>
                            <dd>{formatDateTime(record.created_at)}</dd>
                          </div>
                          <div>
                            <dt class="font-medium text-foreground">마지막 사용</dt>
                            <dd>{formatDateTime(record.last_used_at)}</dd>
                          </div>
                          <div>
                            <dt class="font-medium text-foreground">폐기일</dt>
                            <dd>{formatDateTime(record.revoked_at)}</dd>
                          </div>
                        </dl>
                      </div>

                      <Show when={!isRevoked(record)}>
                        <button
                          type="button"
                          onClick={() => void handleRevoke(record.id)}
                          disabled={revokingId() === record.id}
                          class="inline-flex items-center justify-center rounded-full border border-rose-400/30 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {revokingId() === record.id ? '폐기 중...' : '폐기'}
                        </button>
                      </Show>
                    </div>
                  </article>
                )}
              </For>
            </div>
          </Show>
        </Show>
      </div>
    </section>
  )
}
