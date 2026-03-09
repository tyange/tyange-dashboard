import { useNavigate, useSearchParams } from '@solidjs/router'
import { createEffect, createMemo, createSignal } from 'solid-js'
import { fetchWeeklySpendRecords, fetchWeeklySummary } from '../api'
import { isBudgetNotConfiguredError } from '../errors'
import type { WeeklySpendRecord } from '../types'
import BudgetSetupRequiredState from './BudgetSetupRequiredState'
import SpendRecordsPage from './SpendRecordsPage'

export default function SpendRecordsRoutePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams<{ week?: string }>()
  const [resolvedWeekKey, setResolvedWeekKey] = createSignal<string | null>(searchParams.week ?? null)
  const [records, setRecords] = createSignal<WeeklySpendRecord[]>([])
  const [loading, setLoading] = createSignal(true)
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null)
  const [requiresBudgetSetup, setRequiresBudgetSetup] = createSignal(false)

  createEffect(() => {
    const requestedWeek = searchParams.week

    if (!requestedWeek) {
      setLoading(true)
      setErrorMessage(null)
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

    setResolvedWeekKey(requestedWeek)
    setLoading(true)
    setErrorMessage(null)
    setRequiresBudgetSetup(false)

    void fetchWeeklySpendRecords(requestedWeek)
      .then((nextRecords) => {
        setRecords(nextRecords)
      })
      .catch((error) => {
        if (isBudgetNotConfiguredError(error)) {
          setRequiresBudgetSetup(true)
        }
        setErrorMessage((error as Error).message)
        setRecords([])
      })
      .finally(() => {
        setLoading(false)
      })
  })

  const weekKey = createMemo(() => resolvedWeekKey() ?? '-')

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
        errorMessage={errorMessage()}
        onBack={() => void navigate('/dashboard')}
      />
    )
  )
}
