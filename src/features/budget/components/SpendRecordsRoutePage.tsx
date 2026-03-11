import { useNavigate } from '@solidjs/router'
import { createSignal, onMount } from 'solid-js'
import {
  createSpendRecord,
  deleteAllSpendRecords,
  deleteSpendRecord,
  fetchBudgetSummary,
  fetchSpendingGroups,
  importSpendingCommit,
  importSpendingPreview,
  updateSpendRecord,
} from '../api'
import { getApiErrorStatus, isBudgetNotConfiguredError } from '../errors'
import type {
  BudgetSummary,
  CreateSpendingResponse,
  SpendRecord,
  SpendingImportCommitResponse,
  SpendingImportPreviewResponse,
  SpendingListResponse,
} from '../types'
import { toApiDateTime, toDateTimeInputValue } from '../utils'
import BudgetSetupRequiredState from './BudgetSetupRequiredState'
import SpendRecordsPage from './SpendRecordsPage'

function getPreviewErrorMessage(error: unknown) {
  const status = getApiErrorStatus(error)
  const message = (error as Error).message

  if (status === 401) {
    return '로그인 세션이 만료되었습니다. 다시 로그인해 주세요.'
  }

  if (status === 404) {
    return '현재 예산이 없어 가져오기를 진행할 수 없습니다. 예산 기간을 먼저 등록해주세요.'
  }

  if (status === 400) {
    return `잘못된 파일이거나 미리보기를 생성할 수 없습니다. ${message.slice('API 400: '.length).trim()}`
  }

  return message
}

function getCommitErrorMessage(error: unknown) {
  const status = getApiErrorStatus(error)
  const message = (error as Error).message

  if (status === 401) {
    return '로그인 세션이 만료되었습니다. 다시 로그인해 주세요.'
  }

  if (status === 404) {
    return '현재 예산이 없어 가져오기를 반영할 수 없습니다. 예산 기간을 먼저 등록해주세요.'
  }

  if (status === 409) {
    return `선택한 거래와 서버 상태가 일치하지 않습니다. 미리보기를 다시 불러온 뒤 재시도해주세요. ${message.slice('API 409: '.length).trim()}`
  }

  if (status === 400) {
    return `업로드 요청을 처리하지 못했습니다. ${message.slice('API 400: '.length).trim()}`
  }

  return message
}

function getMutationErrorMessage(error: unknown) {
  const status = getApiErrorStatus(error)

  if (status === 401) {
    return '로그인 세션이 만료되었습니다. 다시 로그인해 주세요.'
  }

  if (status === 404) {
    return '현재 예산이 없거나 수정할 소비 기록을 찾지 못했습니다.'
  }

  return (error as Error).message
}

export default function SpendRecordsRoutePage() {
  const navigate = useNavigate()
  const [summary, setSummary] = createSignal<BudgetSummary | null>(null)
  const [spendingGroups, setSpendingGroups] = createSignal<SpendingListResponse | null>(null)
  const [loading, setLoading] = createSignal(true)
  const [saving, setSaving] = createSignal(false)
  const [deletingRecordId, setDeletingRecordId] = createSignal<number | null>(null)
  const [deletingAll, setDeletingAll] = createSignal(false)
  const [editingRecordId, setEditingRecordId] = createSignal<number | null>(null)
  const [amountInput, setAmountInput] = createSignal('')
  const [merchantInput, setMerchantInput] = createSignal('')
  const [transactedAtInput, setTransactedAtInput] = createSignal('')
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null)
  const [successMessage, setSuccessMessage] = createSignal<string | null>(null)
  const [requiresBudgetSetup, setRequiresBudgetSetup] = createSignal(false)
  const [importFile, setImportFile] = createSignal<File | null>(null)
  const [importPreview, setImportPreview] = createSignal<SpendingImportPreviewResponse | null>(null)
  const [importResult, setImportResult] = createSignal<SpendingImportCommitResponse | null>(null)
  const [selectedFingerprints, setSelectedFingerprints] = createSignal<string[]>([])
  const [previewLoading, setPreviewLoading] = createSignal(false)
  const [commitLoading, setCommitLoading] = createSignal(false)
  const [importMessage, setImportMessage] = createSignal<string | null>(null)

  const resetForm = () => {
    setEditingRecordId(null)
    setAmountInput('')
    setMerchantInput('')
    setTransactedAtInput('')
  }

  const resetImportState = () => {
    setImportPreview(null)
    setImportResult(null)
    setSelectedFingerprints([])
    setImportMessage(null)
  }

  const loadRecords = async (options?: { preserveImportFeedback?: boolean }) => {
    setLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    setRequiresBudgetSetup(false)

    if (!options?.preserveImportFeedback) {
      setImportMessage(null)
      setImportResult(null)
    }

    try {
      const nextSummary = await fetchBudgetSummary()
      let nextGroups: SpendingListResponse

      try {
        nextGroups = await fetchSpendingGroups()
      } catch (error) {
        if (isBudgetNotConfiguredError(error)) {
          nextGroups = {
            budget_id: nextSummary.budget_id,
            from_date: nextSummary.from_date,
            to_date: nextSummary.to_date,
            total_spent: nextSummary.total_spent,
            remaining: nextSummary.remaining_budget,
            weeks: [],
          }
        } else {
          throw error
        }
      }

      setSummary(nextSummary)
      setSpendingGroups(nextGroups)
    } catch (error) {
      if (isBudgetNotConfiguredError(error)) {
        setRequiresBudgetSetup(true)
        setSummary(null)
        setSpendingGroups(null)
      } else {
        setErrorMessage(getMutationErrorMessage(error))
      }
    } finally {
      setLoading(false)
    }
  }

  onMount(() => {
    void loadRecords()
  })

  const submitRecord = async () => {
    if (saving()) return

    const amount = Number(amountInput())
    const transactedAt = transactedAtInput().trim()
    const merchantRaw = merchantInput().trim()
    const merchant = merchantRaw === '' ? null : merchantRaw

    if (!Number.isFinite(amount) || amount <= 0) {
      setErrorMessage('금액은 0보다 큰 숫자로 입력해주세요.')
      setSuccessMessage(null)
      return
    }

    if (!transactedAt) {
      setErrorMessage('사용 일시를 입력해주세요.')
      setSuccessMessage(null)
      return
    }

    const apiDateTime = toApiDateTime(transactedAt)
    const parsedDate = new Date(apiDateTime)
    if (Number.isNaN(parsedDate.getTime())) {
      setErrorMessage('사용 일시 형식이 올바르지 않습니다.')
      setSuccessMessage(null)
      return
    }

    setSaving(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const recordId = editingRecordId()
      if (recordId === null) {
        const result: CreateSpendingResponse = await createSpendRecord(amount, merchant, apiDateTime)
        setSummary((prev) =>
          prev
            ? {
                ...prev,
                total_spent: result.period_total_spent,
                remaining_budget: result.remaining,
                alert: result.alert,
              }
            : prev,
        )
        setSuccessMessage('소비 기록을 저장했습니다.')
      } else {
        await updateSpendRecord(recordId, amount, merchant, apiDateTime)
        setSuccessMessage('소비 기록을 수정했습니다.')
      }

      resetForm()
      await loadRecords({ preserveImportFeedback: true })
    } catch (error) {
      setErrorMessage(getMutationErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const startEditing = (record: SpendRecord) => {
    setEditingRecordId(record.record_id)
    setAmountInput(String(record.amount))
    setMerchantInput(record.merchant ?? '')
    setTransactedAtInput(toDateTimeInputValue(record.transacted_at))
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  const removeRecord = async (recordId: number) => {
    if (deletingRecordId() !== null || deletingAll()) return

    setDeletingRecordId(recordId)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      await deleteSpendRecord(recordId)
      if (editingRecordId() === recordId) {
        resetForm()
      }
      setSuccessMessage('소비 기록을 삭제했습니다.')
      await loadRecords({ preserveImportFeedback: true })
    } catch (error) {
      setErrorMessage(getMutationErrorMessage(error))
    } finally {
      setDeletingRecordId(null)
    }
  }

  const removeAllRecords = async () => {
    if (deletingAll() || deletingRecordId() !== null) return

    const groups = spendingGroups()
    const totalRecordCount = groups?.weeks.reduce((sum, group) => sum + group.record_count, 0) ?? 0

    if (totalRecordCount === 0) return

    const confirmed = window.confirm(`현재 소비 기록 ${totalRecordCount}건을 모두 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)
    if (!confirmed) return

    setDeletingAll(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      await deleteAllSpendRecords()
      resetForm()
      setSuccessMessage('소비 기록을 전체 삭제했습니다.')
      await loadRecords({ preserveImportFeedback: true })
    } catch (error) {
      setErrorMessage(getMutationErrorMessage(error))
    } finally {
      setDeletingAll(false)
    }
  }

  const handleImportFile = (file: File | null) => {
    setImportFile(file)
    resetImportState()
  }

  const requestPreview = async () => {
    const file = importFile()

    if (!file) {
      setImportMessage('가져올 신한카드 XLS 파일을 먼저 선택해주세요.')
      setImportResult(null)
      return
    }

    setPreviewLoading(true)
    setImportMessage(null)
    setImportResult(null)
    setImportPreview(null)
    setSelectedFingerprints([])

    try {
      const preview = await importSpendingPreview(file)
      const defaults = preview.rows
        .filter((row) => row.status === 'new')
        .map((row) => row.fingerprint)

      setImportPreview(preview)
      setSelectedFingerprints(defaults)
      setImportMessage(`미리보기를 불러왔습니다. 신규 ${preview.summary.new_count}건이 기본 선택되었습니다.`)
    } catch (error) {
      setImportMessage(getPreviewErrorMessage(error))
    } finally {
      setPreviewLoading(false)
    }
  }

  const toggleFingerprint = (fingerprint: string, checked: boolean) => {
    setSelectedFingerprints((prev) => {
      if (checked) {
        return prev.includes(fingerprint) ? prev : [...prev, fingerprint]
      }

      return prev.filter((value) => value !== fingerprint)
    })
  }

  const selectAllFingerprints = () => {
    const preview = importPreview()
    if (!preview) return

    setSelectedFingerprints(
      preview.rows.filter((row) => row.status === 'new').map((row) => row.fingerprint),
    )
  }

  const clearSelectedFingerprints = () => {
    setSelectedFingerprints([])
  }

  const commitImport = async () => {
    const file = importFile()
    const preview = importPreview()
    const fingerprints = selectedFingerprints()

    if (!file || !preview) {
      setImportMessage('먼저 미리보기를 생성해주세요.')
      return
    }

    if (fingerprints.length === 0) {
      setImportMessage('반영할 신규 거래를 하나 이상 선택해주세요.')
      return
    }

    setCommitLoading(true)
    setImportMessage(null)
    setImportResult(null)

    try {
      const result = await importSpendingCommit(file, fingerprints)
      setImportResult(result)
      setImportPreview(null)
      setSelectedFingerprints([])
      setImportMessage(
        `가져오기를 반영했습니다. ${result.inserted_count}건이 추가되었고 예산 요약과 소비 기록을 다시 불러왔습니다.`,
      )
      await loadRecords({ preserveImportFeedback: true })
    } catch (error) {
      setImportMessage(getCommitErrorMessage(error))
    } finally {
      setCommitLoading(false)
    }
  }

  if (requiresBudgetSetup()) {
    return (
      <BudgetSetupRequiredState
        title="소비 기록을 보기 전에 예산을 등록해주세요."
        description="현재 적용 예산이 아직 없어 소비 기록 범위를 계산할 수 없습니다. 기간 총예산을 먼저 생성한 뒤 다시 시도해주세요."
      />
    )
  }

  return (
    <SpendRecordsPage
      fromDate={spendingGroups()?.from_date ?? summary()?.from_date ?? '-'}
      toDate={spendingGroups()?.to_date ?? summary()?.to_date ?? '-'}
      totalSpent={spendingGroups()?.total_spent ?? summary()?.total_spent ?? 0}
      remainingBudget={spendingGroups()?.remaining ?? summary()?.remaining_budget ?? 0}
      weekGroups={spendingGroups()?.weeks ?? []}
      loading={loading()}
      saving={saving()}
      deletingRecordId={deletingRecordId()}
      deletingAll={deletingAll()}
      editingRecordId={editingRecordId()}
      amountInput={amountInput()}
      merchantInput={merchantInput()}
      transactedAtInput={transactedAtInput()}
      errorMessage={errorMessage()}
      successMessage={successMessage()}
      importFileName={importFile()?.name ?? null}
      importPreview={importPreview()}
      importResult={importResult()}
      importMessage={importMessage()}
      previewLoading={previewLoading()}
      commitLoading={commitLoading()}
      selectedFingerprints={selectedFingerprints()}
      selectableFingerprintCount={importPreview()?.rows.filter((row) => row.status === 'new').length ?? 0}
      onAmountInput={setAmountInput}
      onMerchantInput={setMerchantInput}
      onTransactedAtInput={setTransactedAtInput}
      onSubmit={submitRecord}
      onStartEditing={startEditing}
      onCancelEditing={resetForm}
      onDelete={removeRecord}
      onDeleteAll={removeAllRecords}
      onImportFileChange={handleImportFile}
      onRequestPreview={requestPreview}
      onToggleFingerprint={toggleFingerprint}
      onSelectAllFingerprints={selectAllFingerprints}
      onClearSelectedFingerprints={clearSelectedFingerprints}
      onCommitImport={commitImport}
      onBack={() => void navigate('/dashboard')}
    />
  )
}
