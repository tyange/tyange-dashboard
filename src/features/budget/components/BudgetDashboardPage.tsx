import { useNavigate } from '@solidjs/router'
import { createMemo, createSignal, onMount } from 'solid-js'
import { fetchBudgetSummary } from '../api'
import { isBudgetNotConfiguredError } from '../errors'
import type { BudgetSummary } from '../types'
import BudgetSetupRequiredState from './BudgetSetupRequiredState'
import WeeklyBudgetCard from './WeeklyBudgetCard'

const emptySummary: BudgetSummary = {
  budget_id: 0,
  total_budget: 0,
  from_date: '-',
  to_date: '-',
  total_spent: 0,
  remaining_budget: 0,
  usage_rate: 0,
  alert: false,
  alert_threshold: 0,
}

export default function BudgetDashboardPage() {
  const navigate = useNavigate()
  const [summary, setSummary] = createSignal<BudgetSummary | null>(null)
  const [loading, setLoading] = createSignal(true)
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null)
  const [requiresBudgetSetup, setRequiresBudgetSetup] = createSignal(false)

  const refreshSummary = async () => {
    setLoading(true)
    setErrorMessage(null)
    setRequiresBudgetSetup(false)

    try {
      const data = await fetchBudgetSummary()
      setSummary(data)
    } catch (error) {
      if (isBudgetNotConfiguredError(error)) {
        setRequiresBudgetSetup(true)
        setSummary(null)
      } else {
        setErrorMessage((error as Error).message)
      }
    } finally {
      setLoading(false)
    }
  }

  onMount(() => {
    void refreshSummary()
  })

  const usagePercent = createMemo(() => {
    const value = summary()?.usage_rate ?? 0
    return Math.max(0, Math.min(100, value * 100))
  })

  return (
    <section aria-label="Dashboard">
      {requiresBudgetSetup() && <BudgetSetupRequiredState />}

      {!requiresBudgetSetup() && errorMessage() && (
        <div class="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage()}
        </div>
      )}

      {!requiresBudgetSetup() && (
        <WeeklyBudgetCard
          title="활성 기간 예산"
          summary={summary() ?? emptySummary}
          loading={loading()}
          onRefresh={() => void refreshSummary()}
          usagePercent={usagePercent()}
          onOpenRecordsPage={() => void navigate('/records')}
        />
      )}
    </section>
  )
}
