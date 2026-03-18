import { useTheme, type ThemeMode } from '../theme/ThemeProvider'

type ThemeToggleProps = {
  class?: string
}

const nextThemeMap: Record<ThemeMode, ThemeMode> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" class="h-4 w-4">
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8" />
      <path
        d="M12 2.75v2.5M12 18.75v2.5M21.25 12h-2.5M5.25 12h-2.5M18.54 5.46l-1.77 1.77M7.23 16.77l-1.77 1.77M18.54 18.54l-1.77-1.77M7.23 7.23 5.46 5.46"
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-width="1.8"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" class="h-4 w-4">
      <path
        d="M19.25 14.25A7.25 7.25 0 0 1 9.75 4.75a8.5 8.5 0 1 0 9.5 9.5Z"
        fill="none"
        stroke="currentColor"
        stroke-linejoin="round"
        stroke-width="1.8"
      />
    </svg>
  )
}

function DesktopIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" class="h-4 w-4">
      <rect x="3.75" y="4.75" width="16.5" height="11.5" rx="2" fill="none" stroke="currentColor" stroke-width="1.8" />
      <path
        d="M9 19.25h6M12 16.25v3"
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-width="1.8"
      />
    </svg>
  )
}

export default function ThemeToggle(props: ThemeToggleProps) {
  const theme = useTheme()

  const currentLabel = () => {
    const currentTheme = theme.theme()
    if (currentTheme === 'system') {
      return `시스템 테마 (${theme.resolvedTheme()})`
    }
    return currentTheme === 'light' ? '라이트 테마' : '다크 테마'
  }

  const nextLabel = () => {
    const nextTheme = nextThemeMap[theme.theme()]
    if (nextTheme === 'system') {
      return '시스템 테마로 전환'
    }
    return nextTheme === 'light' ? '라이트 테마로 전환' : '다크 테마로 전환'
  }

  const icon = () => {
    switch (theme.theme()) {
      case 'light':
        return <SunIcon />
      case 'dark':
        return <MoonIcon />
      case 'system':
        return <DesktopIcon />
    }
  }

  return (
    <button
      type="button"
      onClick={() => theme.setTheme(nextThemeMap[theme.theme()])}
      title={`${currentLabel()} · ${nextLabel()}`}
      aria-label={`${currentLabel()}. ${nextLabel()}`}
      class={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-card/90 text-muted-foreground shadow-[0_10px_30px_color-mix(in_srgb,var(--shadow-color)_14%,transparent)] transition hover:bg-secondary hover:text-foreground ${props.class ?? ''}`}
    >
      {icon()}
    </button>
  )
}
