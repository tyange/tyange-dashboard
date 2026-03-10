import { useNavigate, useSearchParams } from '@solidjs/router'
import { createEffect, createMemo, createSignal } from 'solid-js'
import { createSpendRecord, deleteSpendRecord, fetchWeeklySpendRecords, fetchWeeklySummary, updateSpendRecord } from '../api'
import { isBudgetNotConfiguredError } from '../errors'
import type { WeeklySpendRecord } from '../types'
import { dateToWeekKey } from '../weekKey'
import BudgetSetupRequiredState from './BudgetSetupRequiredState'
import SpendRecordsPage from './SpendRecordsPage'

function toDateTimeInputValue(value: string) {
  const normalized = value.replace(' ', 'T')
  return normalized.length >= 16 ? normalized.slice(0, 16) : normalized
}

function toApiDateTime(value: string) {
  return value.length === 16 ? `${value}:00` : value
}

function getWeekKeyFromDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return dateToWeekKey(date)
}

export default function SpendRecordsRoutePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams<{ week?: string }>()
  const [resolvedWeekKey, setResolvedWeekKey] = createSignal<string | null>(searchParams.week ?? null)
  const [records, setRecords] = createSignal<WeeklySpendRecord[]>([])
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

  const loadWeek = async (weekKey: string) => {
    setResolvedWeekKey(weekKey)
    setLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    setRequiresBudgetSetup(false)

    try {
      const nextRecords = await fetchWeeklySpendRecords(weekKey)
      setRecords(nextRecords)
    } catch (error) {
      if (isBudgetNotConfiguredError(error)) {
        setRequiresBudgetSetup(true)
      }
      setErrorMessage((error as Error).message)
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  createEffect(() => {
    const requestedWeek = searchParams.week

    if (!requestedWeek) {
      setLoading(true)
      setErrorMessage(null)
      setSuccessMessage(null)
      setRequiresBudgetSetup(false)
      void fetchWeeklySummary()
        .then((summary) => {
          void navigate(`/records?week=${encodeURIComponent(summary.week_key)}`, { replace: true })
        })
        .catch((error) => {
          if (isBudgetNotConfiguredError(error)) {
            setRequiresBudgetSetup(true)
          }
          setErrorMessage((error as Error).message)
          setLoading(false)
        })
      return
    }

    void loadWeek(requestedWeek)
  })

  const weekKey = createMemo(() => resolvedWeekKey() ?? '-')

  const submitRecord = async () => {
    if (saving()) return

    const currentWeekKey = resolvedWeekKey()
    const amount = Number(amountInput())
    const transactedAt = transactedAtInput().trim()
    const merchantRaw = merchantInput().trim()
    const merchant = merchantRaw === '' ? null : merchantRaw

    if (!currentWeekKey) {
      setErrorMessage('주차 정보를 확인할 수 없습니다.')
      setSuccessMessage(null)
      return
    }

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
    const targetWeekKey = getWeekKeyFromDateTime(apiDateTime)
    if (!targetWeekKey) {
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
        await createSpendRecord(amount, merchant, apiDateTime)
        setSuccessMessage('소비 기록을 저장했습니다.')
      } else {
        await updateSpendRecord(recordId, amount, merchant, apiDateTime)
        setSuccessMessage('소비 기록을 수정했습니다.')
      }

      resetForm()

      if (targetWeekKey !== currentWeekKey) {
        void navigate(`/records?week=${encodeURIComponent(targetWeekKey)}`, { replace: true })
        return
      }

      await loadWeek(currentWeekKey)
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const startEditing = (record: WeeklySpendRecord) => {
    setEditingRecordId(record.record_id)
    setAmountInput(String(record.amount))
    setMerchantInput(record.merchant ?? '')
    setTransactedAtInput(toDateTimeInputValue(record.transacted_at))
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  const removeRecord = async (recordId: number) => {
    const currentWeekKey = resolvedWeekKey()
    if (!currentWeekKey || deletingRecordId() !== null) return

    setDeletingRecordId(recordId)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      await deleteSpendRecord(recordId)
      if (editingRecordId() === recordId) {
        resetForm()
      }
      setSuccessMessage('소비 기록을 삭제했습니다.')
      await loadWeek(currentWeekKey)
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setDeletingRecordId(null)
    }
  }

  return (
    requiresBudgetSetup() ? (
      <BudgetSetupRequiredState
        title="소비 기록을 보기 전에 예산을 등록해주세요."
        description="예산 설정이 아직 없어 소비 기록 범위를 계산할 수 없습니다. CMS에서 주간 예산을 먼저 등록한 뒤 다시 시도해주세요."
      />
    ) : (
      <SpendRecordsPage
        weekKey={weekKey()}
        records={records()}
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
  )
}
