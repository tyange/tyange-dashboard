import { createContext, createEffect, createMemo, createSignal, onCleanup, onMount, useContext } from 'solid-js'
import type { JSX, ParentProps } from 'solid-js'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

type ThemeContextValue = {
  theme: () => ThemeMode
  resolvedTheme: () => ResolvedTheme
  setTheme: (theme: ThemeMode) => void
}

const STORAGE_KEY = 'ui-theme'
const ThemeContext = createContext<ThemeContextValue>()

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(theme: ThemeMode): ResolvedTheme {
  return theme === 'system' ? getSystemTheme() : theme
}

export function applyTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.dataset.theme = resolveTheme(theme)
}

export function loadStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'system'
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY)
  if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
    return storedTheme
  }

  return 'system'
}

export function ThemeProvider(props: ParentProps): JSX.Element {
  const [theme, setThemeSignal] = createSignal<ThemeMode>('system')
  const resolvedTheme = createMemo<ResolvedTheme>(() => resolveTheme(theme()))

  const setTheme = (nextTheme: ThemeMode) => {
    setThemeSignal(nextTheme)

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, nextTheme)
    }
  }

  onMount(() => {
    const storedTheme = loadStoredTheme()
    setThemeSignal(storedTheme)

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme() === 'system') {
        applyTheme('system')
      }
    }

    mediaQuery.addEventListener('change', handleChange)

    onCleanup(() => {
      mediaQuery.removeEventListener('change', handleChange)
    })
  })

  createEffect(() => {
    applyTheme(theme())
  })

  const value: ThemeContextValue = {
    theme,
    resolvedTheme,
    setTheme,
  }

  return <ThemeContext.Provider value={value}>{props.children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('ThemeProvider is required')
  }

  return context
}
