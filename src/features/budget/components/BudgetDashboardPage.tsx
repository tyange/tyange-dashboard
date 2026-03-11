import { useNavigate } from '@solidjs/router'
import { createMemo, createSignal, onMount } from 'solid-js'
import { fetchBudgetSummary } from '../api'
import { getApiErrorStatus, isBudgetNotConfiguredError } from '../errors'
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

function getSummaryErrorMessage(error: unknown) {
  if (getApiErrorStatus(error) === 401) {
    return '로그인 세션이 만료되었습니다. 다시 로그인해 주세요.'
  }

  return (error as Error).message
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
        setErrorMessage(getSummaryErrorMessage(error))
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
      {requiresBudgetSetup() && (
        <BudgetSetupRequiredState
          title="현재 예산을 먼저 등록해주세요."
          description="현재 적용 예산이 없습니다. 예산 설정 화면에서 기간 총예산을 생성하거나 엑셀 계산 결과를 검토한 뒤 직접 저장해주세요."
        />
      )}

      {!requiresBudgetSetup() && errorMessage() && (
        <div class="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage()}
        </div>
      )}

      {!requiresBudgetSetup() && (
        <WeeklyBudgetCard
          title="현재 적용 예산"
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
