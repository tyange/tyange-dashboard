import { For, Show, createSignal, onMount } from 'solid-js'
import { createApiKey, fetchApiKeys, revokeApiKey } from '../api'
import type { ApiKeyRecord } from '../types'

type ApiKeysPageProps = {
  embedded?: boolean
}

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

export default function ApiKeysPage(props: ApiKeysPageProps) {
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
    if (creating()) return

    const name = nameInput().trim()
    if (!name) {
      setErrorMessage('이름을 입력해 주세요.')
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
      setSuccessMessage(`"${created.name}" 키를 발급했어요.`)
      await loadApiKeys()
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (apiKeyId: number) => {
    if (revokingId() !== null) return

    setRevokingId(apiKeyId)
    setErrorMessage(null)
    setSuccessMessage(null)
    setIssuedApiKey(null)
    setCopyMessage(null)

    try {
      await revokeApiKey(apiKeyId)
      setSuccessMessage('키를 폐기했어요.')
      await loadApiKeys()
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setRevokingId(null)
    }
  }

  const handleCopy = async () => {
    const apiKey = issuedApiKey()
    if (!apiKey) return

    try {
      await navigator.clipboard.writeText(apiKey)
      setCopyMessage('복사했어요.')
    } catch {
      setCopyMessage('복사에 실패했어요.')
    }
  }

<<<<<<< Updated upstream
  const ghostButton =
    'inline-flex h-11 items-center justify-center rounded-full border border-border/70 bg-card/82 px-4 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60'
  const primaryButton =
    'inline-flex h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-60'
=======
  return (
    <section class="space-y-6">
      <div class="rounded-[2rem] border border-white/10 bg-card/80 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <p class="text-sm font-semibold uppercase tracking-[0.18em] text-accent">API Keys</p>
        <h1 class="mt-3 text-2xl font-semibold tracking-tight text-foreground">API 키 발급</h1>
        <p class="mt-3 text-sm leading-6 text-muted-foreground">
          API 키는 발급 직후 한 번만 표시돼요. 바로 복사해 두세요.
        </p>
>>>>>>> Stashed changes

  return (
    <section class={props.embedded ? 'space-y-8' : 'space-y-8 pb-10'}>
      <Show
        when={props.embedded}
        fallback={
          <header>
            <div>
              <h1 class="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">API 키</h1>
            </div>
          </header>
        }
      >
        <header class="pt-8">
          <div>
            <h2 class="text-2xl font-semibold tracking-tight text-foreground">API 키</h2>
          </div>
        </header>
      </Show>

      <div class={props.embedded ? 'border-b border-border/70 pb-5' : 'border-b border-border/70 py-5'}>
        <div class="grid gap-4">
          <label class="block">
            <span class="mb-2 block text-xs uppercase tracking-[0.16em] text-muted-foreground">이름</span>
            <input
              type="text"
              value={nameInput()}
              onInput={(event) => setNameInput(event.currentTarget.value)}
              placeholder="예: macrodroid-main-phone"
              class="w-full rounded-2xl border border-border/70 bg-background/82 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent"
            />
          </label>

<<<<<<< Updated upstream
          <div class="flex justify-start">
            <button type="button" onClick={() => void handleCreate()} disabled={creating()} class={primaryButton}>
              {creating() ? '발급 중...' : 'API 키 발급'}
=======
          <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-xs leading-5 text-muted-foreground">
              소비 기록 API 호출 시 X-API-Key 헤더에 넣어 사용하세요.
            </p>
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={creating()}
              class="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating() ? '발급 중…' : 'API 키 발급'}
>>>>>>> Stashed changes
            </button>
          </div>

          <p class="text-sm leading-6 text-muted-foreground">
            `POST /budget/spending` 호출 시 `X-API-Key` 헤더로 사용할 수 있습니다.
          </p>
        </div>
<<<<<<< Updated upstream
      </div>

      <Show when={errorMessage()}>
        {(message) => (
          <div class="rounded-2xl border border-rose-400/30 bg-rose-500/8 px-4 py-3 text-sm text-rose-600">
            {message()}
=======

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
                  <p class="text-sm font-semibold text-sky-100">지금만 볼 수 있는 API 키</p>
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
                보안을 위해 이 키는 다시 볼 수 없어요.
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
            <p class="mt-1 text-sm text-muted-foreground">내가 만든 키만 표시돼요.</p>
>>>>>>> Stashed changes
          </div>
        )}
      </Show>

      <Show when={successMessage()}>
        {(message) => (
          <div class="rounded-2xl border border-emerald-400/30 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-600">
            {message()}
          </div>
        )}
      </Show>

      <Show when={issuedApiKey()}>
        {(apiKey) => (
          <section class="rounded-[1.5rem] border border-sky-400/24 bg-sky-500/8 p-5">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div class="min-w-0">
                <p class="text-sm font-semibold text-sky-700">이번 한 번만 표시되는 API 키</p>
                <p class="mt-3 break-all rounded-2xl border border-border/70 bg-background/88 px-4 py-3 font-mono text-sm text-foreground">
                  {apiKey()}
                </p>
                <p class="mt-3 text-xs leading-5 text-muted-foreground">
                  목록 화면에서는 보안상 원문을 다시 보여주지 않습니다.
                  <Show when={copyMessage()}>
                    {(message) => <span class="ml-2 text-foreground">{message()}</span>}
                  </Show>
                </p>
              </div>
              <button type="button" onClick={() => void handleCopy()} class={ghostButton}>
                복사
              </button>
            </div>
          </section>
        )}
      </Show>

      <section class="pt-2">
        <div class="mb-5">
          <h3 class="text-2xl font-semibold tracking-tight text-foreground">발급된 키</h3>
        </div>

<<<<<<< Updated upstream
        <Show when={!loading()} fallback={<p class="text-sm text-muted-foreground">목록을 불러오는 중...</p>}>
          <Show when={apiKeys().length > 0} fallback={<p class="text-sm text-muted-foreground">아직 발급된 API 키가 없습니다.</p>}>
            <div class="overflow-x-auto rounded-[1.25rem] border border-border/70">
              <table class="min-w-full border-collapse text-left text-sm">
                <thead class="bg-secondary/65 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  <tr>
                    <th class="px-4 py-3 font-medium">이름</th>
                    <th class="px-4 py-3 font-medium">상태</th>
                    <th class="px-4 py-3 font-medium">생성일</th>
                    <th class="px-4 py-3 font-medium">마지막 사용</th>
                    <th class="px-4 py-3 font-medium">폐기일</th>
                    <th class="px-4 py-3 font-medium">관리</th>
                  </tr>
                </thead>
                <tbody class="bg-card/65">
                  <For each={apiKeys()}>
                    {(record) => (
                      <tr class="border-t border-border/60">
                        <td class="px-4 py-3 align-middle text-base font-medium text-foreground">{record.name}</td>
                        <td class="px-4 py-3 align-middle">
=======
        <Show when={!loading()} fallback={<p class="mt-6 text-sm text-muted-foreground">불러오는 중…</p>}>
          <Show
            when={apiKeys().length > 0}
            fallback={<p class="mt-6 text-sm text-muted-foreground">아직 발급한 키가 없어요.</p>}
          >
            <div class="mt-6 space-y-4">
              <For each={apiKeys()}>
                {(record) => (
                  <article class="rounded-3xl border border-white/8 bg-black/20 p-4">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div class="min-w-0">
                        <div class="flex items-center gap-2">
                          <h3 class="truncate text-base font-semibold text-foreground">{record.name}</h3>
>>>>>>> Stashed changes
                          <span
                            class={`rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] ${
                              isRevoked(record)
                                ? 'bg-rose-500/14 text-rose-700'
                                : 'bg-emerald-500/14 text-emerald-700'
                            }`}
                          >
                            {isRevoked(record) ? '중지됨' : '사용 중'}
                          </span>
<<<<<<< Updated upstream
                        </td>
                        <td class="px-4 py-3 align-middle text-muted-foreground">{formatDateTime(record.created_at)}</td>
                        <td class="px-4 py-3 align-middle text-muted-foreground">{formatDateTime(record.last_used_at)}</td>
                        <td class="px-4 py-3 align-middle text-muted-foreground">{formatDateTime(record.revoked_at)}</td>
                        <td class="px-4 py-3 align-middle">
                          <Show when={!isRevoked(record)} fallback={<span class="text-muted-foreground">-</span>}>
                            <button
                              type="button"
                              onClick={() => void handleRevoke(record.id)}
                              disabled={revokingId() === record.id}
                              class="inline-flex h-10 items-center justify-center rounded-full border border-rose-400/30 px-4 text-sm font-medium text-rose-600 transition hover:bg-rose-500/8 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {revokingId() === record.id ? '폐기 중...' : '폐기'}
                            </button>
                          </Show>
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
=======
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
                          {revokingId() === record.id ? '폐기 중…' : '폐기'}
                        </button>
                      </Show>
                    </div>
                  </article>
                )}
              </For>
>>>>>>> Stashed changes
            </div>
          </Show>
        </Show>
      </section>
    </section>
  )
}
