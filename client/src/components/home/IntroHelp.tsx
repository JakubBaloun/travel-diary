import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { days, trip } from "@/data/itinerary";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

const CZECH_MONTHS_GEN = [
  "ledna",
  "února",
  "března",
  "dubna",
  "května",
  "června",
  "července",
  "srpna",
  "září",
  "října",
  "listopadu",
  "prosince",
];

function formatTripRange(start: string, end: string): string {
  const [, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  if (sm === em) return `${sd}. – ${ed}. ${CZECH_MONTHS_GEN[em - 1]} ${ey}`;
  return `${sd}. ${CZECH_MONTHS_GEN[sm - 1]} – ${ed}. ${CZECH_MONTHS_GEN[em - 1]} ${ey}`;
}

type Tab = "intro" | "help";

function IntroHelp() {
  const [active, setActive] = useState<Tab | null>(null);
  const open = active !== null;

  function toggle(tab: Tab) {
    setActive((prev) => (prev === tab ? null : tab));
  }

  return (
    <section className="mx-auto max-w-3xl px-4 sm:px-6">
      <div className="flex justify-center gap-2">
        <TabTrigger
          emoji="ℹ"
          label="Úvod"
          active={active === "intro"}
          onClick={() => toggle("intro")}
        />
        <TabTrigger
          emoji="💡"
          label="Nápověda"
          active={active === "help"}
          onClick={() => toggle("help")}
        />
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="mt-2 rounded-md bg-surface px-4 py-4 text-sm leading-relaxed text-surface-foreground shadow-sm sm:px-5 sm:py-5">
            {active === "intro" && <IntroContent />}
            {active === "help" && <HelpContent />}
          </div>
        </div>
      </div>
    </section>
  );
}

function TabTrigger({
  emoji,
  label,
  active,
  onClick,
}: {
  emoji: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={active}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? "bg-brand text-brand-foreground"
          : "bg-surface text-surface-foreground hover:bg-muted"
      }`}
    >
      <span aria-hidden>{emoji}</span>
      <span>{label}</span>
      <ChevronDown
        className={`size-4 transition-transform ${active ? "rotate-180" : ""}`}
      />
    </button>
  );
}

function IntroContent() {
  const tripRange = formatTripRange(trip.start, trip.end);
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <p className="text-lg font-semibold tracking-tight text-brand sm:text-xl">
        Vítejte v našem deníku z cesty po USA!
      </p>

      <p className="max-w-prose leading-relaxed">
        Patnáct dní budeme cestovat napříč východním pobřežím USA. Uvidíme
        ohňostroj na oslavu 250. výročí Deklarace nezávislosti, projedeme celou
        Novou Anglii, navštívíme 13 států a podíváme se i do hlavního města USA.
        Každý večer sem budeme přidávat fotky a krátké postřehy, ať jste s námi
        i vy.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span aria-hidden>📅</span>
          {tripRange}
        </span>
        <span aria-hidden className="opacity-50">
          ·
        </span>
        <span className="inline-flex items-center gap-1">
          <span aria-hidden>🗓️</span>
          {days.length} dní
        </span>
        <span aria-hidden className="opacity-50">
          ·
        </span>
        <span className="inline-flex items-center gap-1">
          <span aria-hidden>🇺🇸</span>
          východní pobřeží
        </span>
      </div>

      <p className="max-w-prose text-muted-foreground">
        <span aria-hidden className="mr-1">
          💌
        </span>
        Budeme rádi, když stránku s heslem budete sdílet s kýmkoli, kdo by měl o
        naši cestu zájem.
      </p>

      <div className="flex flex-col items-center gap-1">
        <p className="text-muted-foreground">
          Fotky z cesty můžete sledovat průběžně i na Instagramu:
        </p>
        <a
          href="https://instagram.com/baloun_jakub"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 font-medium text-brand transition-opacity hover:opacity-80"
        >
          <InstagramIcon className="size-4" />
          @baloun_jakub
        </a>
      </div>
    </div>
  );
}

function HelpContent() {
  return (
    <ul className="space-y-2">
      <Hint
        emoji="🎴"
        text="V posuvném seznamu se postupně odkrývají karty jednotlivých dní. Kliknutím na kartu se dostanete na stránku konkrétního dne."
      />
      <Hint
        emoji="🗺️"
        text="Na interaktivní mapě jsou postupně zobrazovány kolečka s číslem dne a trasou, tak jak jednotlivá místa projíždíme."
      />
      <Hint
        emoji="🇺🇸"
        text="Jména všech států, které na cestě navštívíme, se zobrazí dotykem nebo najetím myši na stát."
      />
      <Hint
        emoji="📍"
        text="Kliknutím na kolečko se dostanete na stránku konkrétního dne."
      />
      <Hint
        emoji="🗽"
        text="Zastávky BOS a NYC jsou místa, kde trávíme více dní. Po kliknutí se otevře seznam, ze kterého vyberete konkrétní den."
      />
      <Hint
        emoji="🖼️"
        text="Na stránce s detaily dne se nachází krátký popis dne a fotky. Fotky se dají prohlížet jako galerie."
      />
      <Hint
        emoji="🎨"
        text="Ikonka vpravo nahoře u nadpisu přepíná barevné motivy."
      />
      <Hint emoji="🚪" text="Vedle motivů je tlačítko pro odhlášení." />
    </ul>
  );
}

function Hint({ emoji, text }: { emoji: string; text: string }) {
  return (
    <li className="flex gap-3">
      <span aria-hidden className="shrink-0 text-base leading-relaxed">
        {emoji}
      </span>
      <span>{text}</span>
    </li>
  );
}

export default IntroHelp;
