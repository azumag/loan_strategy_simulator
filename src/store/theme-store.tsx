import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Variant = 'A' | 'B'
type Mode = 'light' | 'dark'

type ThemeCtx = {
  variant: Variant
  mode: Mode
  setVariant: (v: Variant) => void
  setMode: (m: Mode) => void
  toggleMode: () => void
}

const Ctx = createContext<ThemeCtx | null>(null)

const VARIANT_KEY = 'ui.variant'
const MODE_KEY = 'ui.theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [variant, setVariantState] = useState<Variant>(() => {
    if (typeof window === 'undefined') return 'A'
    return (localStorage.getItem(VARIANT_KEY) as Variant) || 'A'
  })
  const [mode, setModeState] = useState<Mode>(() => {
    if (typeof window === 'undefined') return 'light'
    const saved = localStorage.getItem(MODE_KEY) as Mode | null
    if (saved) return saved
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    root.dataset.variant = variant
    root.dataset.theme = mode
    localStorage.setItem(VARIANT_KEY, variant)
    localStorage.setItem(MODE_KEY, mode)
  }, [variant, mode])

  return (
    <Ctx.Provider
      value={{
        variant,
        mode,
        setVariant: setVariantState,
        setMode: setModeState,
        toggleMode: () => setModeState((m) => (m === 'light' ? 'dark' : 'light')),
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
