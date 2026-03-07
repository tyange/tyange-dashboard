import { useNavigate, useSearchParams } from '@solidjs/router'
import { createEffect, createMemo, createSignal } from 'solid-js'
import { fetchWeeklySpendRecords, fetchWeeklySummary } from '../api'
import type { WeeklySpendRecord } from '../types'
import SpendRecordsPage from './SpendRecordsPage'

export default function SpendRecordsRoutePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams<{ week?: string }>()
  const [resolvedWeekKey, setResolvedWeekKey] = createSignal<string | null>(searchParams.week ?? null)
  const [records, setRecords] = createSignal<WeeklySpendRecord[]>([])
  const [loading, setLoading] = createSignal(true)
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null)

  createEffect(() => {
    const requestedWeek = searchParams.week

    if (!requestedWeek) {
      setLoading(true)
      setErrorMessage(null)
      void fetchWeeklySummary()
        .then((summary) => {
          void navigate(`/records?week=${encodeURIComponent(summary.week_key)}`, { replace: true })
        })
        .catch((error) => {
          setErrorMessage((error as Error).message)
          setLoading(false)
        })
      return
    }

    setResolvedWeekKey(requestedWeek)
    setLoading(true)
    setErrorMessage(null)

    void fetchWeeklySpendRecords(requestedWeek)
      .then((nextRecords) => {
        setRecords(nextRecords)
      })
      .catch((error) => {
        setErrorMessage((error as Error).message)
        setRecords([])
      })
      .finally(() => {
        setLoading(false)
      })
  })

  const weekKey = createMemo(() => resolvedWeekKey() ?? '-')

  return (
    <SpendRecordsPage
      weekKey={weekKey()}
      records={records()}
      loading={loading()}
      errorMessage={errorMessage()}
      onBack={() => void navigate('/dashboard')}
    />
  )
}
