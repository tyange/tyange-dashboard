export type BudgetSummary = {
  budget_id: number
  total_budget: number
  from_date: string
  to_date: string
  total_spent: number
  remaining_budget: number
  usage_rate: number
  alert: boolean
  alert_threshold: number
  is_overspent?: boolean
}

export type BudgetUpsertPayload = {
  total_budget: number
  alert_threshold?: number
  total_spent?: number
}

export type BudgetPlanPayload = BudgetUpsertPayload & {
  from_date: string
  to_date: string
}

export type SpendRecord = {
  record_id: number
  amount: number
  merchant: string | null
  transacted_at: string
  created_at: string
}

export type SpendingWeekGroup = {
  week_key: string
  weekly_total: number
  record_count: number
  records: SpendRecord[]
}

export type SpendingListResponse = {
  budget_id: number
  from_date: string
  to_date: string
  total_spent: number
  remaining_budget: number
  weeks: SpendingWeekGroup[]
}

export type CreateSpendingResponse = {
  record_id: number
  budget_id: number
  period_total_spent: number
  total_budget: number
  remaining: number
  alert: boolean
}

export type ApiStatusResponse<T = null> = {
  status: boolean
  data?: T | null
  message?: string | null
}
