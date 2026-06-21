import {
  ACTIVITY_EMOJI,
  type LiveActivityData,
  type LiveActivityVariant,
  LiveActivityView,
} from "@/components/trips/LiveActivity"
import { type ActivityType } from "@/data/timeline"

interface MockCase {
  key: string
  label: string
  data: LiveActivityData
}

const ACTIVITY_SAMPLES: Record<ActivityType, { primary: string; secondary: string }> = {
  flying: { primary: "Letíme do USA", secondary: "Praha → Boston" },
  driving: { primary: "Road trip do Vermontu", secondary: "Vermont" },
  train: { primary: "Příjezd do New Yorku", secondary: "New York City" },
  walking: { primary: "Boston: Freedom Trail a Harvard", secondary: "Boston, MA" },
  sightseeing: { primary: "NYC: Midtown a 9/11 Memorial", secondary: "New York City" },
  museum: { primary: "MoMA", secondary: "New York City" },
  shopping: { primary: "NYC: Top of the Rock a 5th Avenue", secondary: "New York City" },
  hiking: { primary: "White Mountains", secondary: "White Mountains, NH" },
  viewpoint: { primary: "NYC: West Side a Empire State", secondary: "New York City" },
  sleeping: { primary: "Spíme", secondary: "" },
  baseball: { primary: "NYC: Upper East Side a baseball", secondary: "New York City" },
  fireworks: { primary: "Přílet do Bostonu & Independence Day", secondary: "Boston, MA" },
  exploring: { primary: "Maine pobřeží: Portland", secondary: "Portland, ME" },
}

function buildCases(): MockCase[] {
  const activityCases: MockCase[] = (
    Object.keys(ACTIVITY_SAMPLES) as ActivityType[]
  ).map((type) => ({
    key: type,
    label: type,
    data: {
      type,
      emoji: ACTIVITY_EMOJI[type],
      primary: ACTIVITY_SAMPLES[type].primary,
      secondary: ACTIVITY_SAMPLES[type].secondary,
      topLabel: "Právě teď",
    },
  }))

  const upcomingCase: MockCase = {
    key: "upcoming",
    label: "upcoming",
    data: {
      type: "exploring",
      emoji: ACTIVITY_EMOJI.exploring,
      primary: "20 dní",
      secondary: "USA Červenec 2026",
      topLabel: "Odlet za",
    },
  }

  const longTextCase: MockCase = {
    key: "long-text",
    label: "long-text (truncate)",
    data: {
      type: "sightseeing",
      emoji: ACTIVITY_EMOJI.sightseeing,
      primary: "Velmi dlouhý název aktivity který se nevejde",
      secondary: "Velmi dlouhé jméno lokace které také přeteče",
      topLabel: "Právě teď",
    },
  }

  return [upcomingCase, ...activityCases, longTextCase]
}

function VariantGrid({
  variant,
  cases,
}: {
  variant: LiveActivityVariant
  cases: MockCase[]
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {cases.map((c) => (
        <div key={c.key} className="flex flex-col gap-2">
          <div className="text-[11px] font-mono text-muted-foreground">
            {c.label}
          </div>
          <LiveActivityView data={c.data} variant={variant} />
        </div>
      ))}
    </div>
  )
}

function DevLiveActivity() {
  const cases = buildCases()

  return (
    <div className="mx-auto max-w-6xl px-6 pt-10 pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          LiveActivity — preview
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Všechny typy aktivit + upcoming/edge cases. Dev only.
        </p>
      </div>

      <section className="mb-12">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Variant: panel
        </h2>
        <VariantGrid variant="panel" cases={cases} />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Variant: chip
        </h2>
        <VariantGrid variant="chip" cases={cases} />
      </section>
    </div>
  )
}

export default DevLiveActivity
