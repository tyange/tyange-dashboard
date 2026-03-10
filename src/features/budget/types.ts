export type CardSize = 'sm' | 'md' | 'lg'
export type CardTone = 'sky' | 'mint' | 'slate' | 'rose'

export type WeeklySummary = {
  week_key: string
  weekly_limit: number
  total_spent: number
  remaining: number
  projected_remaining: number
  usage_rate: number
  alert: boolean
  record_count: number
}

export type WeeklySpendRecord = {
  record_id: number
  amount: number
  merchant: string | null
  transacted_at: string
  created_at: string
}

export type BudgetWeeksResponse = {
  weeks: string[]
  min_week?: string | null
  max_week?: string | null
}

export type SpendingListResponse = {
  week_key: string
  records: WeeklySpendRecord[]
}

export type WeeklyConfig = {
  config_id: number
  week_key: string
  weekly_limit: number
  projected_remaining: number
  alert_threshold: number
}

export type BudgetRebalanceWeekItem = {
  week_key: string
  days: number
  weekly_limit: number
  projected_remaining: number
}

export type BudgetRebalanceResponse = {
  total_budget: number
  from_date: string
  to_date: string
  as_of_date: string
  spent_so_far: number
  remaining_budget: number
  rebalance_from_week: string
  is_overspent: boolean
  weeks: BudgetRebalanceWeekItem[]
}

export type ApiStatusResponse<T = null> = {
  status: boolean
  data?: T | null
  message?: string | null
}

export type SectionRow = {
  label: string
  value: string
}

export type FolderSection = {
  id: string
  title: string
  size: CardSize
  tone: CardTone
  isDummy?: boolean
  isLoading?: boolean
  rows: SectionRow[]
}
