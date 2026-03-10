import { useNavigate } from '@solidjs/router'
import { createSignal, onMount } from 'solid-js'
import { createSpendRecord, deleteSpendRecord, fetchBudgetSummary, fetchSpendingGroups, updateSpendRecord } from '../api'
import { isBudgetNotConfiguredError } from '../errors'
import type { BudgetSummary, CreateSpendingResponse, SpendRecord, SpendingListResponse } from '../types'
import BudgetSetupRequiredState from './BudgetSetupRequiredState'
import SpendRecordsPage from './SpendRecordsPage'

function toDateTimeInputValue(value: string) {
  const normalized = value.replace(' ', 'T')
  return normalized.length >= 16 ? normalized.slice(0, 16) : normalized
}

function toApiDateTime(value: string) {
  return value.length === 16 ? `${value}:00` : value
}

export default function SpendRecordsRoutePage() {
  const navigate = useNavigate()
  const [summary, setSummary] = createSignal<BudgetSummary | null>(null)
  const [spendingGroups, setSpendingGroups] = createSignal<SpendingListResponse | null>(null)
  const [loading, setLoading] = createSignal(true)
  const [saving, setSaving] = createSignal(false)
  const [deletingRecordId, setDeletingRecordId] = createSignal<number | null>(null)
  const [editingRecordId, setEditingRecordId] = createSignal<number | null>(null)
  const [amountInput, setAmountInput] = createSignal('')
  const [merchantInput, setMerchantInput] = createSignal('')
  const [transactedAtInput, setTransactedAtInput] = createSignal('')
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null)
  const [successMessage, setSuccessMessage] = createSignal<string | null>(null)
  const [requiresBudgetSetup, setRequiresBudgetSetup] = createSignal(false)

  const resetForm = () => {
    setEditingRecordId(null)
    setAmountInput('')
    setMerchantInput('')
    setTransactedAtInput('')
  }

  const loadRecords = async () => {
    setLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    setRequiresBudgetSetup(false)

    try {
      const [nextSummary, nextGroups] = await Promise.all([fetchBudgetSummary(), fetchSpendingGroups()])
      setSummary(nextSummary)
      setSpendingGroups(nextGroups)
    } catch (error) {
      if (isBudgetNotConfiguredError(error)) {
        setRequiresBudgetSetup(true)
        setSummary(null)
        setSpendingGroups(null)
      } else {
        setErrorMessage((error as Error).message)
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
      await loadRecords()
    } catch (error) {
      setErrorMessage((error as Error).message)
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
    if (deletingRecordId() !== null) return

    setDeletingRecordId(recordId)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      await deleteSpendRecord(recordId)
      if (editingRecordId() === recordId) {
        resetForm()
      }
      setSuccessMessage('소비 기록을 삭제했습니다.')
      await loadRecords()
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setDeletingRecordId(null)
    }
  }

  return requiresBudgetSetup() ? (
    <BudgetSetupRequiredState
      title="소비 기록을 보기 전에 예산을 등록해주세요."
      description="활성 기간 예산이 아직 없어 소비 기록 범위를 계산할 수 없습니다. 기간 총예산을 먼저 생성한 뒤 다시 시도해주세요."
    />
  ) : (
    <SpendRecordsPage
      fromDate={spendingGroups()?.from_date ?? summary()?.from_date ?? '-'}
      toDate={spendingGroups()?.to_date ?? summary()?.to_date ?? '-'}
      totalSpent={spendingGroups()?.total_spent ?? summary()?.total_spent ?? 0}
      remainingBudget={spendingGroups()?.remaining_budget ?? summary()?.remaining_budget ?? 0}
      weekGroups={spendingGroups()?.weeks ?? []}
      loading={loading()}
      saving={saving()}
      deletingRecordId={deletingRecordId()}
      editingRecordId={editingRecordId()}
      amountInput={amountInput()}
      merchantInput={merchantInput()}
      transactedAtInput={transactedAtInput()}
      errorMessage={errorMessage()}
      successMessage={successMessage()}
      onAmountInput={setAmountInput}
      onMerchantInput={setMerchantInput}
      onTransactedAtInput={setTransactedAtInput}
      onSubmit={submitRecord}
      onStartEditing={startEditing}
      onCancelEditing={resetForm}
      onDelete={removeRecord}
      onBack={() => void navigate('/dashboard')}
    />
  )
}
