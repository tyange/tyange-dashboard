import { For, Show } from 'solid-js'
import { krwFormatter } from '../format'
import type {
  SpendRecord,
  SpendingImportCommitResponse,
  SpendingImportPreviewResponse,
  SpendingImportRowStatus,
  SpendingWeekGroup,
} from '../types'

export type SpendRecordsPageProps = {
  fromDate: string
  toDate: string
  totalSpent: number
  remainingBudget: number
  weekGroups: SpendingWeekGroup[]
  loading: boolean
  saving: boolean
  deletingRecordId: number | null
  deletingAll: boolean
  editingRecordId: number | null
  amountInput: string
  merchantInput: string
  transactedAtInput: string
  errorMessage: string | null
  successMessage: string | null
  importFileName: string | null
  importPreview: SpendingImportPreviewResponse | null
  importResult: SpendingImportCommitResponse | null
  importMessage: string | null
  previewLoading: boolean
  commitLoading: boolean
  selectedFingerprints: string[]
  selectableFingerprintCount: number
  onAmountInput: (value: string) => void
  onMerchantInput: (value: string) => void
  onTransactedAtInput: (value: string) => void
  onSubmit: () => void
  onStartEditing: (record: SpendRecord) => void
  onCancelEditing: () => void
  onDelete: (recordId: number) => void
  onDeleteAll: () => void
  onImportFileChange: (file: File | null) => void
  onRequestPreview: () => void
  onToggleFingerprint: (fingerprint: string, checked: boolean) => void
  onSelectAllFingerprints: () => void
  onClearSelectedFingerprints: () => void
  onCommitImport: () => void
  onBack: () => void
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, '')
}

function formatRecordDate(value: string) {
  const date = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isSelectableStatus(status: SpendingImportRowStatus) {
  return status === 'new'
}

function statusBadgeClass(status: SpendingImportRowStatus) {
  switch (status) {
    case 'new':
      return 'bg-emerald-500/15 text-emerald-100'
    case 'duplicate':
      return 'bg-amber-500/15 text-amber-100'
    case 'out_of_period':
      return 'bg-sky-500/15 text-sky-100'
    case 'invalid':
      return 'bg-rose-500/15 text-rose-100'
  }
}

function statusLabel(status: SpendingImportRowStatus) {
  switch (status) {
    case 'new':
      return '신규'
    case 'duplicate':
      return '중복'
    case 'out_of_period':
      return '기간 외'
    case 'invalid':
      return '오류'
  }
}

export default function SpendRecordsPage(props: SpendRecordsPageProps) {
  const panel = 'rounded-[1.75rem] border border-white/8 bg-black/28 p-5 shadow-[0_18px_44px_rgba(0,0,0,0.24)] backdrop-blur-xl'
  const compactPanel = 'rounded-[1.5rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-4 shadow-[0_16px_36px_rgba(0,0,0,0.18)]'
  const inputClass =
    'w-full rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-white/28 focus:border-accent/55'
  const primaryButton =
    'inline-flex h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-55'
  const ghostButton =
    'inline-flex h-11 items-center justify-center rounded-full border border-white/8 bg-white/4 px-4 text-sm font-medium text-white/78 transition hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:opacity-55'
  const dangerButton =
    'inline-flex h-11 items-center justify-center rounded-full border border-red-500/24 bg-red-500/10 px-4 text-sm font-medium text-red-200 transition hover:bg-red-500/16 disabled:cursor-not-allowed disabled:opacity-55'
  const totalRecordCount = () => props.weekGroups.reduce((sum, group) => sum + group.record_count, 0)
  const currentWeekRecords = () => props.weekGroups[0]?.record_count ?? 0
  const importExpanded = () => Boolean(props.importFileName || props.importPreview || props.importResult || props.importMessage)
  const hasSummary = () => props.fromDate !== '-' && props.toDate !== '-'

  return (
    <article aria-label="소비 기록 페이지" class="space-y-5">
      <header class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">Spend Records</p>
          <h1 class="mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">소비 기록</h1>
          <p class="mt-3 text-base text-muted-foreground">주차 그룹과 상세 거래를 바로 확인합니다.</p>
        </div>
        <div class="flex flex-wrap gap-3">
          <button type="button" class={ghostButton} onClick={props.onBack}>
            대시보드로
          </button>
          <button
            type="button"
            class={dangerButton}
            onClick={props.onDeleteAll}
            disabled={props.loading || props.saving || props.deletingRecordId !== null || props.deletingAll || totalRecordCount() === 0}
          >
            {props.deletingAll ? '전체 삭제 중...' : '전체 삭제'}
          </button>
        </div>
      </header>

      <Show when={hasSummary()}>
        <section class="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <article class={`${panel} overflow-hidden`}>
            <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p class="text-lg font-medium text-white/48">적용 기간</p>
                <p class="mt-3 text-3xl font-semibold tracking-tight text-foreground">{props.fromDate} ~ {props.toDate}</p>
                <p class="mt-4 text-sm text-white/52">총 지출 {krwFormatter.format(props.totalSpent)} · 잔여 {krwFormatter.format(props.remainingBudget)}</p>
              </div>
              <div class="grid min-w-[220px] gap-3 sm:grid-cols-2 lg:w-[260px] lg:grid-cols-1">
                <div class="rounded-2xl bg-white/4 px-4 py-3">
                  <p class="text-xs uppercase tracking-[0.16em] text-white/40">전체 거래</p>
                  <p class="mt-2 text-3xl font-semibold text-foreground">{totalRecordCount()}</p>
                </div>
                <div class="rounded-2xl bg-white/4 px-4 py-3">
                  <p class="text-xs uppercase tracking-[0.16em] text-white/40">이번 주</p>
                  <p class="mt-2 text-3xl font-semibold text-accent">{currentWeekRecords()}</p>
                </div>
              </div>
            </div>
          </article>

          <article class={`${panel} border-emerald-500/22 bg-[linear-gradient(180deg,rgba(4,20,17,0.92),rgba(4,10,14,0.94))]`}>
            <div class="flex h-full flex-col justify-between gap-6">
              <div>
                <p class="text-lg font-medium text-white/48">빠른 입력</p>
                <p class="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                  {props.editingRecordId ? '거래 수정' : '거래 추가'}
                </p>
                <p class="mt-2 text-sm text-white/52">무거운 폼 대신 간단한 입력으로 바로 반영합니다.</p>
              </div>
              <div class="grid gap-3 sm:grid-cols-3">
                <label class="block">
                  <span class="mb-2 block text-xs uppercase tracking-[0.16em] text-white/40">금액</span>
                  <input
                    type="text"
                    inputmode="numeric"
                    value={props.amountInput}
                    onInput={(event) => props.onAmountInput(digitsOnly(event.currentTarget.value))}
                    class={inputClass}
                    placeholder="12000"
                  />
                </label>
                <label class="block">
                  <span class="mb-2 block text-xs uppercase tracking-[0.16em] text-white/40">가맹점</span>
                  <input
                    type="text"
                    value={props.merchantInput}
                    onInput={(event) => props.onMerchantInput(event.currentTarget.value)}
                    class={inputClass}
                    placeholder="스타벅스"
                  />
                </label>
                <label class="block">
                  <span class="mb-2 block text-xs uppercase tracking-[0.16em] text-white/40">사용 일시</span>
                  <input
                    type="datetime-local"
                    value={props.transactedAtInput}
                    onInput={(event) => props.onTransactedAtInput(event.currentTarget.value)}
                    class={inputClass}
                  />
                </label>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <Show when={props.editingRecordId !== null}>
                  <button type="button" class={ghostButton} onClick={props.onCancelEditing} disabled={props.saving}>
                    취소
                  </button>
                </Show>
                <button type="button" class={primaryButton} onClick={props.onSubmit} disabled={props.saving}>
                  {props.saving ? '저장 중...' : props.editingRecordId ? '수정 저장' : '기록 저장'}
                </button>
              </div>
            </div>
          </article>
        </section>
      </Show>

      <Show when={props.errorMessage}>
        {(message) => (
          <div class="rounded-2xl border border-red-500/28 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {message()}
          </div>
        )}
      </Show>

      <Show when={props.successMessage}>
        {(message) => (
          <div class="rounded-2xl border border-emerald-500/24 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {message()}
          </div>
        )}
      </Show>

      <section class={panel}>
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p class="text-lg font-medium text-white/48">신한카드 XLS 가져오기</p>
            <p class="mt-2 text-sm text-white/52">기본 상태에서는 간단히, 미리보기 생성 후에는 검토 영역이 확장됩니다.</p>
          </div>
          <div class="flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="file"
              accept=".xls,application/vnd.ms-excel"
              class="block w-full rounded-2xl border border-white/8 bg-white/4 px-3 py-3 text-sm text-foreground file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-5 file:py-2 file:text-sm file:font-semibold file:text-accent-foreground"
              onChange={(event) => props.onImportFileChange(event.currentTarget.files?.[0] ?? null)}
            />
            <button
              type="button"
              class={`${primaryButton} min-w-32`}
              onClick={props.onRequestPreview}
              disabled={!props.importFileName || props.previewLoading || props.commitLoading}
            >
              {props.previewLoading ? '미리보기 중...' : '미리보기'}
            </button>
          </div>
        </div>

        <Show when={props.importFileName}>
          {(fileName) => <p class="mt-3 text-sm text-white/46">선택 파일: {fileName()}</p>}
        </Show>

        <Show when={props.importMessage}>
          {(message) => (
            <div class="mt-4 rounded-2xl border border-sky-400/24 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
              {message()}
            </div>
          )}
        </Show>

        <Show when={importExpanded()}>
          <div class="mt-5 space-y-4">
            <Show when={props.importPreview}>
              {(preview) => (
                <>
                  <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <article class={compactPanel}>
                      <p class="text-xs uppercase tracking-[0.16em] text-white/40">신규 반영</p>
                      <p class="mt-3 text-2xl font-semibold text-foreground">{preview().summary.new_count}건</p>
                    </article>
                    <article class={compactPanel}>
                      <p class="text-xs uppercase tracking-[0.16em] text-white/40">중복</p>
                      <p class="mt-3 text-2xl font-semibold text-foreground">{preview().summary.duplicate_count}건</p>
                    </article>
                    <article class={compactPanel}>
                      <p class="text-xs uppercase tracking-[0.16em] text-white/40">기간 외</p>
                      <p class="mt-3 text-2xl font-semibold text-foreground">{preview().summary.out_of_period_count}건</p>
                    </article>
                    <article class={compactPanel}>
                      <p class="text-xs uppercase tracking-[0.16em] text-white/40">신규 금액</p>
                      <p class="mt-3 text-2xl font-semibold text-foreground">{krwFormatter.format(preview().summary.new_amount_sum)}</p>
                    </article>
                    <article class={compactPanel}>
                      <p class="text-xs uppercase tracking-[0.16em] text-white/40">신규 순지출</p>
                      <p class="mt-3 text-2xl font-semibold text-foreground">{krwFormatter.format(preview().summary.new_net_amount_sum)}</p>
                    </article>
                  </div>

                  <div class="flex flex-col gap-4 rounded-[1.5rem] border border-white/8 bg-white/3 p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p class="text-xs uppercase tracking-[0.16em] text-white/40">Detected</p>
                      <p class="mt-2 text-sm text-foreground">
                        감지 소스 {preview().detected_source} · 전체 {preview().summary.parsed_count}건
                      </p>
                      <p class="mt-1 text-sm text-white/52">
                        반영 선택 {props.selectedFingerprints.length} / 선택 가능 {props.selectableFingerprintCount}
                      </p>
                    </div>
                    <div class="flex flex-wrap gap-2">
                      <button
                        type="button"
                        class={ghostButton}
                        onClick={props.onSelectAllFingerprints}
                        disabled={props.commitLoading || props.previewLoading || props.selectableFingerprintCount === 0}
                      >
                        전체 선택
                      </button>
                      <button
                        type="button"
                        class={ghostButton}
                        onClick={props.onClearSelectedFingerprints}
                        disabled={props.commitLoading || props.previewLoading || props.selectedFingerprints.length === 0}
                      >
                        선택 해제
                      </button>
                      <button
                        type="button"
                        class={primaryButton}
                        onClick={props.onCommitImport}
                        disabled={props.commitLoading || props.previewLoading || props.selectedFingerprints.length === 0}
                      >
                        {props.commitLoading ? '반영 중...' : '선택 항목 반영'}
                      </button>
                    </div>
                  </div>

                  <div class="overflow-x-auto rounded-[1.5rem] border border-white/8">
                    <table class="min-w-full border-collapse text-left text-sm">
                      <thead class="bg-white/4 text-xs uppercase tracking-[0.14em] text-white/42">
                        <tr>
                          <th class="px-4 py-3 font-medium">선택</th>
                          <th class="px-4 py-3 font-medium">거래일시</th>
                          <th class="px-4 py-3 font-medium">금액</th>
                          <th class="px-4 py-3 font-medium">가맹점</th>
                          <th class="px-4 py-3 font-medium">상태</th>
                          <th class="px-4 py-3 font-medium">사유</th>
                        </tr>
                      </thead>
                      <tbody>
                        <For each={preview().rows}>
                          {(row) => {
                            const selectable = isSelectableStatus(row.status)
                            const checked = () => props.selectedFingerprints.includes(row.fingerprint)

                            return (
                              <tr class="border-t border-white/6 bg-black/18">
                                <td class="px-4 py-3 align-top">
                                  <input
                                    type="checkbox"
                                    checked={checked()}
                                    disabled={!selectable || props.commitLoading}
                                    onChange={(event) => props.onToggleFingerprint(row.fingerprint, event.currentTarget.checked)}
                                    class="h-4 w-4 rounded border-white/12 bg-white/4 text-accent"
                                  />
                                </td>
                                <td class="px-4 py-3 align-top text-foreground">{row.transacted_at ? formatRecordDate(row.transacted_at) : '-'}</td>
                                <td class="px-4 py-3 align-top font-medium text-foreground">{row.amount === null ? '-' : krwFormatter.format(row.amount)}</td>
                                <td class="px-4 py-3 align-top text-foreground">{row.merchant || '기타 지출'}</td>
                                <td class="px-4 py-3 align-top">
                                  <span class={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusBadgeClass(row.status)}`}>
                                    {statusLabel(row.status)}
                                  </span>
                                </td>
                                <td class="px-4 py-3 align-top text-xs text-white/48">
                                  {row.reason || (selectable ? '반영 가능' : '-')}
                                </td>
                              </tr>
                            )
                          }}
                        </For>
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </Show>

            <Show when={props.importResult}>
              {(result) => (
                <div class="rounded-[1.5rem] border border-emerald-500/24 bg-emerald-500/10 p-5">
                  <h3 class="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-100/80">가져오기 반영 결과</h3>
                  <div class="mt-4 grid gap-3 md:grid-cols-3">
                    <article class="rounded-2xl bg-black/14 px-4 py-4">
                      <p class="text-xs uppercase tracking-[0.14em] text-emerald-100/60">추가된 거래</p>
                      <p class="mt-2 text-2xl font-semibold text-white">{result().inserted_count}건</p>
                    </article>
                    <article class="rounded-2xl bg-black/14 px-4 py-4">
                      <p class="text-xs uppercase tracking-[0.14em] text-emerald-100/60">추가 금액 합계</p>
                      <p class="mt-2 text-2xl font-semibold text-white">{krwFormatter.format(result().inserted_amount_sum)}</p>
                    </article>
                    <article class="rounded-2xl bg-black/14 px-4 py-4">
                      <p class="text-xs uppercase tracking-[0.14em] text-emerald-100/60">추가 순지출 합계</p>
                      <p class="mt-2 text-2xl font-semibold text-white">{krwFormatter.format(result().inserted_net_amount_sum)}</p>
                    </article>
                  </div>
                  <p class="mt-4 text-sm leading-6 text-emerald-100/82">
                    반영 후 적용 기간 소비 합계는 {krwFormatter.format(result().period_total_spent_from_records)}이고 남은 예산은 {krwFormatter.format(result().remaining)}입니다.
                  </p>
                </div>
              )}
            </Show>
          </div>
        </Show>
      </section>

      <section class={panel}>
        <div class="mb-5 flex items-end justify-between gap-3">
          <div>
            <p class="text-lg font-medium text-white/48">거래 목록</p>
            <p class="mt-2 text-sm text-white/52">주차 그룹은 표시용이며 예산 계산은 항상 적용 기간 전체 합계를 기준으로 합니다.</p>
          </div>
        </div>

        <Show when={!props.loading} fallback={<p class="text-sm text-white/48">소비 기록을 불러오는 중...</p>}>
          <Show when={props.weekGroups.length > 0} fallback={<p class="text-sm text-white/48">소비 기록이 없습니다.</p>}>
            <div class="space-y-6">
              <For each={props.weekGroups}>
                {(group) => (
                  <section class="space-y-3">
                    <header class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p class="text-2xl font-semibold tracking-tight text-foreground">{group.week_key}</p>
                        <p class="mt-1 text-sm text-white/44">{group.record_count}건</p>
                      </div>
                      <p class="text-2xl font-semibold tracking-tight text-foreground">{krwFormatter.format(group.weekly_total)}</p>
                    </header>

                    <ul class="overflow-hidden rounded-[1.5rem] border border-white/8">
                      <For each={group.records}>
                        {(record) => (
                          <li class="flex flex-col gap-4 border-t border-white/6 bg-white/2 px-4 py-4 first:border-t-0 md:flex-row md:items-center md:justify-between">
                            <div class="min-w-0">
                              <p class="truncate text-base font-medium text-foreground">{record.merchant || '기타 지출'}</p>
                              <p class="mt-1 text-sm text-white/46">{formatRecordDate(record.transacted_at)}</p>
                            </div>

                            <div class="flex flex-wrap items-center gap-3 md:justify-end">
                              <span class="text-lg font-semibold text-foreground">{krwFormatter.format(record.amount)}</span>
                              <button type="button" class={ghostButton} onClick={() => props.onStartEditing(record)} disabled={props.saving}>
                                수정
                              </button>
                              <button
                                type="button"
                                class={dangerButton}
                                onClick={() => props.onDelete(record.record_id)}
                                disabled={props.deletingRecordId !== null || props.deletingAll}
                              >
                                {props.deletingRecordId === record.record_id ? '삭제 중...' : '삭제'}
                              </button>
                            </div>
                          </li>
                        )}
                      </For>
                    </ul>
                  </section>
                )}
              </For>
            </div>
          </Show>
        </Show>
      </section>
    </article>
  )
}
