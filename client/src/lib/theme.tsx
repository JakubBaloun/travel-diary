import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

export const themes = [
  "light",
  "dark",
  "sunset",
  "ocean",
  "forest",
  "sepia",
  "midnight",
] as const

export type Theme = (typeof themes)[number]

export type ThemeMode = "light" | "dark"

export interface ThemeMeta {
  label: string
  mode: ThemeMode
  /** Two-color swatch (background + accent) used by the picker. */
  swatch: [string, string]
}

export const themeMeta: Record<Theme, ThemeMeta> = {
  light:    { label: "Light",    mode: "light", swatch: ["oklch(0.985 0.003 240)", "oklch(0.52 0.16 250)"] },
  dark:     { label: "Dark",     mode: "dark",  swatch: ["oklch(0.18 0.01 250)",   "oklch(0.72 0.13 245)"] },
  sunset:   { label: "Sunset",   mode: "dark",  swatch: ["oklch(0.22 0.05 30)",    "oklch(0.78 0.16 55)"]  },
  ocean:    { label: "Ocean",    mode: "dark",  swatch: ["oklch(0.19 0.05 230)",   "oklch(0.76 0.13 195)"] },
  forest:   { label: "Forest",   mode: "dark",  swatch: ["oklch(0.2 0.04 150)",    "oklch(0.74 0.13 140)"] },
  sepia:    { label: "Sepia",    mode: "light", swatch: ["oklch(0.96 0.025 75)",   "oklch(0.5 0.12 55)"]   },
  midnight: { label: "Midnight", mode: "dark",  swatch: ["oklch(0.16 0.06 285)",   "oklch(0.76 0.16 300)"] },
}

export const STORAGE_KEY = "travel-diary-theme"
const DEFAULT_THEME: Theme = "dark"

function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (themes as readonly string[]).includes(value)
}

export function readStoredTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return isTheme(stored) ? stored : DEFAULT_THEME
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return
  const root = document.documentElement
  root.dataset.theme = theme
  root.classList.toggle("dark", themeMeta[theme].mode === "dark")
  root.style.colorScheme = themeMeta[theme].mode
}

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  themes: readonly Theme[]
  meta: typeof themeMeta
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme())

  useEffect(() => {
    applyTheme(theme)
    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* storage unavailable — silently ignore */
    }
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, themes, meta: themeMeta }),
    [theme, setTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>")
  return ctx
}
