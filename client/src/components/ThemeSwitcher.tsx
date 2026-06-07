import { Menu } from "@base-ui/react/menu"
import { Palette, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme, type Theme } from "@/lib/theme"

function ThemeSwitcher() {
  const { theme, setTheme, themes, meta } = useTheme()

  return (
    <Menu.Root>
      <Menu.Trigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Změnit téma"
            title="Téma"
          >
            <Palette />
          </Button>
        }
      />
      <Menu.Portal>
        <Menu.Positioner sideOffset={8} align="end">
          <Menu.Popup className="z-50 min-w-44 overflow-hidden rounded-xl border border-surface-border bg-popover p-1 text-popover-foreground shadow-xl ring-1 ring-black/5 outline-none">
            <Menu.RadioGroup
              value={theme}
              onValueChange={(v) => setTheme(v as Theme)}
            >
              {themes.map((t) => {
                const m = meta[t]
                const isActive = t === theme
                return (
                  <Menu.RadioItem
                    key={t}
                    value={t}
                    className="group/item flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                  >
                    <span
                      aria-hidden
                      className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-border"
                      style={{
                        background: `linear-gradient(135deg, ${m.swatch[0]} 0 50%, ${m.swatch[1]} 50% 100%)`,
                      }}
                    />
                    <span className="flex-1">{m.label}</span>
                    {isActive && <Check className="size-3.5 opacity-70" />}
                  </Menu.RadioItem>
                )
              })}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}

export default ThemeSwitcher
