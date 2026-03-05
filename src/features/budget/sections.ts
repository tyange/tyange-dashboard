import { krwFormatter } from './format'
import type { FolderSection, WeeklySummary } from './types'

export function getLoadingSections(): FolderSection[] {
  return [
    {
      id: 'loading-weekly-budget',
      title: 'Weekly Budget',
      size: 'lg',
      tone: 'slate',
      isLoading: true,
      rows: [
        { label: 'Week', value: 'Loading...' },
        { label: 'Weekly Limit', value: 'Loading...' },
        { label: 'Total Spent', value: 'Loading...' },
        { label: 'Remaining', value: 'Loading...' },
      ],
    },
    {
      id: 'loading-dummy-1',
      title: 'Dummy Section',
      size: 'sm',
      tone: 'sky',
      isDummy: true,
      rows: [{ label: 'Status', value: 'Loading...' }],
    },
  ]
}

export function getDashboardSections(data: WeeklySummary): FolderSection[] {
  return [
    {
      id: 'weekly-budget',
      title: '주간 예산',
      size: 'lg',
      tone: 'slate',
      rows: [
        { label: '주차', value: data.week_key },
        { label: '주간 한도', value: krwFormatter.format(data.weekly_limit) },
        { label: '총 지출', value: krwFormatter.format(data.total_spent) },
        { label: '남은 예산', value: krwFormatter.format(data.remaining) },
        { label: '사용률', value: `${(data.usage_rate * 100).toFixed(1)}%` },
        { label: '알림', value: data.alert ? 'ON' : 'OFF' },
        { label: '기록 수', value: `${data.record_count}건` },
      ],
    },
    {
      id: 'dummy-trend',
      title: 'Dummy Trend',
      size: 'sm',
      tone: 'mint',
      isDummy: true,
      rows: [
        { label: 'Today', value: '+2.3%' },
        { label: '7 Days', value: '+5.9%' },
      ],
    },
    {
      id: 'dummy-service',
      title: 'Dummy Service',
      size: 'md',
      tone: 'sky',
      isDummy: true,
      rows: [
        { label: 'Latency', value: '92ms' },
        { label: 'Error Rate', value: '0.21%' },
        { label: 'Availability', value: '99.9%' },
      ],
    },
    {
      id: 'dummy-channel',
      title: 'Dummy Channel',
      size: 'sm',
      tone: 'rose',
      isDummy: true,
      rows: [
        { label: 'Organic', value: '41%' },
        { label: 'Direct', value: '35%' },
      ],
    },
  ]
}
