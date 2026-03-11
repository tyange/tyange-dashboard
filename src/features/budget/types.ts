export type ApiStatusResponse<T = null> = {
  status: boolean
  data?: T | null
  message?: string | null
}

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
  remaining: number
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

export type SpendingImportRowStatus = 'new' | 'duplicate' | 'out_of_period' | 'invalid'

export type SpendingImportSummary = {
  parsed_count: number
  in_period_count: number
  duplicate_count: number
  new_count: number
  out_of_period_count: number
  invalid_count: number
  new_amount_sum: number
  new_net_amount_sum: number
}

export type SpendingImportPreviewRow = {
  fingerprint: string
  transacted_at: string | null
  amount: number | null
  merchant: string | null
  status: SpendingImportRowStatus
  reason: string | null
}

export type SpendingImportPreviewResponse = {
  detected_source: string
  file_name: string
  summary: SpendingImportSummary
  rows: SpendingImportPreviewRow[]
}

export type SpendingImportCommitResponse = {
  detected_source: string
  file_name: string
  inserted_count: number
  skipped_duplicate_count: number
  skipped_out_of_period_count: number
  skipped_invalid_count: number
  inserted_amount_sum: number
  inserted_net_amount_sum: number
  period_total_spent_from_records: number
  remaining: number
}
