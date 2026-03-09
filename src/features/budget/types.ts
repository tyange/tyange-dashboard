export type CardSize = 'sm' | 'md' | 'lg'
export type CardTone = 'sky' | 'mint' | 'slate' | 'rose'

export type WeeklySummary = {
  week_key: string
  weekly_limit: number
  total_spent: number
  remaining: number
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
  alert_threshold: number
}

export type ApiStatusResponse = {
  status: boolean
  data?: null
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
