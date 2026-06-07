import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { CalendarDays, X } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface DateRangePickerProps {
  value: { from: string; to: string };
  onChange: (range: { from: string; to: string }) => void;
}

function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [wide, setWide] = useState(window.innerWidth >= 640);

  const selected = value.from
    ? {
        from: new Date(value.from + "T00:00:00"),
        to: value.to ? new Date(value.to + "T00:00:00") : undefined,
      }
    : undefined;

  useEffect(() => {
    function handleResize() {
      setWide(window.innerWidth >= 640);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      if (portalRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleButtonClick() {
    if (open) {
      setOpen(false);
    } else {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const calendarH = wide ? 340 : 380;
        const spaceBelow = window.innerHeight - rect.bottom;
        const top =
          spaceBelow >= calendarH ? rect.bottom + 8 : rect.top - calendarH - 8;
        setPosition({ top, left: rect.left });
      }
      setOpen(true);
    }
  }

  function clearRange() {
    onChange({ from: "", to: "" });
  }

  const hasRange = value.from && value.to;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-muted-foreground">Datum *</label>
      <div className="relative">
        <Button
          ref={buttonRef}
          type="button"
          variant="outline"
          onClick={handleButtonClick}
          className="w-full justify-start text-left font-normal"
        >
          <CalendarDays className="mr-2 size-4 shrink-0" />
          <span className="flex-1 truncate">
            {hasRange
              ? `${formatDate(value.from)} – ${formatDate(value.to)}`
              : "Vyberte rozsah dat"}
          </span>
          {hasRange && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                clearRange();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  clearRange();
                }
              }}
              className="-mr-1 ml-1 flex size-5 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <X className="size-3.5" />
            </span>
          )}
        </Button>
        {open &&
          createPortal(
            <div
              ref={portalRef}
              className="fixed z-50 rounded-xl border border-surface-border bg-popover p-3 text-popover-foreground shadow-xl"
              style={{ top: position.top, left: Math.max(8, position.left) }}
            >
              <DayPicker
                mode="range"
                min={1}
                selected={selected}
                onSelect={(range) => {
                  if (!range) {
                    onChange({ from: "", to: "" });
                    return;
                  }
                  const fromStr = range.from
                    ? format(range.from, "yyyy-MM-dd")
                    : "";
                  const toStr = range.to ? format(range.to, "yyyy-MM-dd") : "";
                  onChange({ from: fromStr, to: toStr });
                  if (fromStr && toStr) setOpen(false);
                }}
                classNames={{
                  month: "space-y-4",
                  caption_label: "text-sm font-medium text-foreground",
                  nav: "space-x-1 flex items-center",
                  button_next: "absolute right-1 top-1",
                  button_previous: "absolute left-1 top-1",
                  months: "flex gap-4",
                  month_grid: "w-full border-collapse",
                  weekdays: "flex",
                  weekday: "w-9 text-center text-xs text-muted-foreground",
                  week: "flex w-full",
                  day: "size-9 p-0 font-normal text-sm text-foreground hover:bg-accent hover:text-accent-foreground rounded-md focus:outline-none",
                  day_button:
                    "size-9 font-normal text-sm aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md focus:outline-none",
                  selected: "bg-primary text-primary-foreground hover:bg-primary/90",
                  range_start: "rounded-l-md bg-primary text-primary-foreground",
                  range_end: "rounded-r-md bg-primary text-primary-foreground",
                  range_middle: "bg-accent text-accent-foreground",
                  today: "border border-ring",
                  outside: "text-muted-foreground/60",
                  disabled: "text-muted-foreground/40 opacity-50 cursor-not-allowed",
                }}
              />
            </div>,
            document.body,
          )}
      </div>
    </div>
  );
}

export default DateRangePicker;
