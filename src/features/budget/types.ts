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

export type BudgetWeeksResponse = {
  weeks: string[]
  min_week?: string | null
  max_week?: string | null
}

export type SectionRow = {
  label: string
  value: string
}

export type ConsumptionRecord = {
  id: string
  amount: number
  place: string
  created_at: string
}

export type ConsumptionRecordsResponse = {
  records: ConsumptionRecord[]
  total_count: number
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
