import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Am I Cooked? — Deadline Panic Calculator" },
      {
        name: "description",
        content:
          "A humorous but useful deadline calculator for students. Plug in your workload and find out if you're actually going to finish.",
      },
      { property: "og:title", content: "Am I Cooked?" },
      {
        property: "og:description",
        content:
          "Put in the numbers. We'll do the panic math and tell you if you're going to make it.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

/*
 * ============================================================
 * CALCULATION LOGIC
 * ============================================================
 * This is the heart of the app. Edit the thresholds and messages
 * below to change how verdicts are decided.
 */

type Verdict = "fine" | "tight" | "crunch" | "cooked";

const PRESET_UNITS = [
  "pages",
  "problems",
  "chapters",
  "words",
  "slides",
  "exercises",
  "tasks",
];

interface CalculationResult {
  remaining: number;
  requiredDaily: number;
  requiredHourly: number;
  timeNeeded: number;
  availableHours: number;
  progressPercent: number;
  unit: string;
  verdict: Verdict;
  verdictTitle: string;
  verdictMessage: string;
}

function calculateDeadline(inputs: {
  total: number;
  completed: number;
  days: number;
  hoursPerDay: number;
  speed: number;
  unit: string;
}): CalculationResult | null {
  const { total, completed, days, hoursPerDay, speed, unit } = inputs;

  // Basic validation
  const values = [total, completed, days, hoursPerDay, speed];
  if (values.some((v) => !Number.isFinite(v) || v < 0)) return null;
  if (completed > total) return null;
  if (days === 0 || hoursPerDay === 0 || speed === 0) return null;

  const remaining = total - completed;
  const availableHours = days * hoursPerDay;
  const requiredDaily = remaining / days;
  const requiredHourly = remaining / availableHours;
  const timeNeeded = remaining / speed;
  const progressPercent = total > 0 ? (completed / total) * 100 : 0;

  // How much harder you need to work compared to your usual pace.
  // 1.0 = exactly your pace. Higher = faster than usual.
  const paceRatio = requiredHourly / speed;

  // --- Verdict thresholds: tweak these to taste ---
  let verdict: Verdict;
  let verdictTitle: string;
  let verdictMessage: string;

  if (paceRatio <= 0.7) {
    verdict = "fine";
    verdictTitle = "You're fine.";
    verdictMessage = `You need ${formatNumber(
      requiredHourly
    )} ${unit}/hour — well below your usual ${formatNumber(speed)}/hour pace.`;
  } else if (paceRatio <= 1.0) {
    verdict = "tight";
    verdictTitle = "Getting tight.";
    verdictMessage = `You need ${formatNumber(
      requiredHourly
    )} ${unit}/hour to match your usual ${formatNumber(speed)}/hour pace. Stay focused.`;
  } else if (paceRatio <= 1.3) {
    verdict = "crunch";
    verdictTitle = "Crunch time.";
    verdictMessage = `You need ${formatNumber(
      requiredHourly
    )} ${unit}/hour — ${formatNumber(paceRatio)}× your usual pace. Push hard.`;
  } else {
    verdict = "cooked";
    verdictTitle = "You are cooked.";
    verdictMessage = `You need ${formatNumber(
      requiredHourly
    )} ${unit}/hour — ${formatNumber(paceRatio)}× your usual pace. Something has to give.`;
  }

  return {
    remaining,
    requiredDaily,
    requiredHourly,
    timeNeeded,
    availableHours,
    progressPercent,
    unit,
    verdict,
    verdictTitle,
    verdictMessage,
  };
}

function formatNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/*
 * ============================================================
 * UI
 * ============================================================
 */

const defaultInputs = {
  total: "",
  completed: "",
  days: "",
  hoursPerDay: "",
  speed: "",
};

function Index() {
  const [inputs, setInputs] = useState(defaultInputs);
  const [selectedUnit, setSelectedUnit] = useState("pages");
  const [customUnit, setCustomUnit] = useState("");
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const activeUnit = useMemo(() => {
    if (selectedUnit === "custom") {
      return customUnit.trim() || "items";
    }
    return selectedUnit;
  }, [selectedUnit, customUnit]);

  function updateInput(key: keyof typeof inputs, value: string) {
    setInputs((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  function handleCalculate() {
    const parsed = {
      total: parseFloat(inputs.total),
      completed: parseFloat(inputs.completed),
      days: parseFloat(inputs.days),
      hoursPerDay: parseFloat(inputs.hoursPerDay),
      speed: parseFloat(inputs.speed),
      unit: activeUnit,
    };

    if (selectedUnit === "custom" && !customUnit.trim()) {
      setError("Please enter a custom unit (e.g. words, slides).");
      setShowResult(false);
      setResult(null);
      return;
    }

    const outcome = calculateDeadline(parsed);

    if (!outcome) {
      setError("Please fill in every field with valid positive numbers.");
      setShowResult(false);
      setResult(null);
      return;
    }

    setError(null);
    setResult(outcome);
    setShowResult(true);
  }

  return (
    <>
      {/* Aurora background */}
      <div className="bg-aurora" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <header className="mb-12 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] text-white/60">
            Panic math, served cold
          </div>
          <h1 className="font-display text-6xl font-extrabold tracking-tight text-white md:text-7xl">
            AM I COOKED?
          </h1>
          <p className="mt-4 text-lg text-white/60">
            Put in the numbers. We&apos;ll do the panic math.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input form */}
          <section className="rounded-3xl border border-white/15 bg-white/10 p-7 shadow-2xl shadow-black/40 backdrop-blur-2xl">
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-white/50">
              The inputs
            </h2>

            <div className="space-y-4">
              <WorkField
                label="Total amount of work"
                placeholder="47"
                value={inputs.total}
                unit={activeUnit}
                selectedUnit={selectedUnit}
                customUnit={customUnit}
                onValueChange={(v) => updateInput("total", v)}
                onUnitChange={setSelectedUnit}
                onCustomUnitChange={setCustomUnit}
                showUnitSelector
              />
              <WorkField
                label="Amount already completed"
                placeholder="12"
                value={inputs.completed}
                unit={activeUnit}
                selectedUnit={selectedUnit}
                customUnit={customUnit}
                onValueChange={(v) => updateInput("completed", v)}
                onUnitChange={setSelectedUnit}
                onCustomUnitChange={setCustomUnit}
              />

              <div className="grid grid-cols-2 gap-4">
                <NumberField
                  label="Time remaining"
                  unit="days"
                  placeholder="2"
                  value={inputs.days}
                  onChange={(v) => updateInput("days", v)}
                />
                <NumberField
                  label="Hours per day"
                  unit="hours"
                  placeholder="4"
                  value={inputs.hoursPerDay}
                  onChange={(v) => updateInput("hoursPerDay", v)}
                />
              </div>

              <NumberField
                label="Estimated working speed"
                unit={`${activeUnit} / hour`}
                placeholder="4"
                value={inputs.speed}
                onChange={(v) => updateInput("speed", v)}
              />
            </div>

            {error && (
              <p className="mt-4 text-sm text-verdict-cooked">{error}</p>
            )}

            <button
              type="button"
              onClick={handleCalculate}
              className="mt-7 w-full rounded-xl bg-gradient-to-r from-primary to-[#a855f7] py-3.5 font-display font-semibold text-white shadow-lg shadow-primary/30 transition hover:brightness-110"
            >
              Calculate my fate
            </button>
          </section>

          {/* Results */}
          <section className="rounded-3xl border border-white/15 bg-white/10 p-7 shadow-2xl shadow-black/40 backdrop-blur-2xl">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/50">
              The verdict
            </h2>

            {!showResult ? (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                <p className="text-white/40">
                  Fill in the form and hit calculate to see your panic report.
                </p>
              </div>
            ) : result ? (
              <div className="result-reveal space-y-5">
                <VerdictCard result={result} />
                <ProgressBar result={result} />
                <StatsGrid result={result} />
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </>
  );
}

/*
 * ============================================================
 * UI COMPONENTS
 * ============================================================
 */

function WorkField({
  label,
  placeholder,
  value,
  unit,
  selectedUnit,
  customUnit,
  onValueChange,
  onUnitChange,
  onCustomUnitChange,
  showUnitSelector = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  unit: string;
  selectedUnit: string;
  customUnit: string;
  onValueChange: (value: string) => void;
  onUnitChange: (value: string) => void;
  onCustomUnitChange: (value: string) => void;
  showUnitSelector?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs text-white/50">{label}</span>
      <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <input
          type="number"
          min={0}
          step="any"
          inputMode="decimal"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          className="w-full bg-transparent text-white placeholder-white/30 outline-none"
        />
        {showUnitSelector ? (
          <div className="flex items-center gap-2">
            <select
              value={selectedUnit}
              onChange={(e) => onUnitChange(e.target.value)}
              className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:ring-1 focus:ring-primary"
              aria-label="Unit of work"
            >
              {PRESET_UNITS.map((u) => (
                <option key={u} value={u} className="bg-[#0c0b14]">
                  {u}
                </option>
              ))}
              <option value="custom" className="bg-[#0c0b14]">
                custom
              </option>
            </select>
            {selectedUnit === "custom" && (
              <input
                type="text"
                value={customUnit}
                onChange={(e) => onCustomUnitChange(e.target.value)}
                placeholder="your unit"
                className="w-28 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-primary"
                aria-label="Custom unit"
              />
            )}
          </div>
        ) : (
          <span className="whitespace-nowrap text-sm text-white/40">{unit}</span>
        )}
      </div>
    </label>
  );
}

function NumberField({
  label,
  unit,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs text-white/50">{label}</span>
      <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <input
          type="number"
          min={0}
          step="any"
          inputMode="decimal"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-white placeholder-white/30 outline-none"
        />
        <span className="whitespace-nowrap text-sm text-white/40">{unit}</span>
      </div>
    </label>
  );
}

function VerdictCard({ result }: { result: CalculationResult }) {
  const verdictStyles: Record<Verdict, string> = {
    fine: "border-verdict-fine/40 bg-verdict-fine/10 text-verdict-fine",
    tight: "border-verdict-tight/40 bg-verdict-tight/10 text-verdict-tight",
    crunch: "border-verdict-crunch/40 bg-verdict-crunch/10 text-verdict-crunch",
    cooked: "border-verdict-cooked/40 bg-verdict-cooked/10 text-verdict-cooked",
  };

  return (
    <div
      className={`rounded-2xl border p-5 ${verdictStyles[result.verdict]}`}
    >
      <div className="text-[11px] uppercase tracking-[0.2em] opacity-80">
        Panic report
      </div>
      <div className="mt-1 font-display text-4xl font-extrabold text-white">
        {result.verdictTitle}
      </div>
      <p className="mt-2 text-sm text-white/60">{result.verdictMessage}</p>
    </div>
  );
}

function ProgressBar({ result }: { result: CalculationResult }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 flex justify-between text-xs text-white/50">
        <span>Completed</span>
        <span>Remaining</span>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-verdict-fine progress-fill"
          style={{ width: `${Math.min(result.progressPercent, 100)}%` }}
        />
        <div
          className="h-full bg-verdict-cooked/70 progress-fill"
          style={{
            width: `${Math.max(0, 100 - result.progressPercent)}%`,
            animationDelay: "0.15s",
          }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-white/40">
        <span>{formatNumber(result.progressPercent)}% done</span>
        <span>{formatNumber(100 - result.progressPercent)}% left</span>
      </div>
    </div>
  );
}

function StatsGrid({ result }: { result: CalculationResult }) {
  const { unit } = result;
  const stats = [
    {
      label: "Required daily pace",
      value: formatNumber(result.requiredDaily),
      unit: `${unit} / day`,
    },
    {
      label: "Required hourly pace",
      value: formatNumber(result.requiredHourly),
      unit: `${unit} / hr`,
    },
    {
      label: "Time needed",
      value: formatNumber(result.timeNeeded),
      unit: "hours total",
    },
    {
      label: "Remaining work",
      value: formatNumber(result.remaining),
      unit: `${unit} left`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-white/10 bg-white/5 p-4"
        >
          <div className="text-xs text-white/50">{stat.label}</div>
          <div className="mt-1 font-display text-2xl font-bold text-white">
            {stat.value}{" "}
            <span className="text-sm font-normal text-white/40">{stat.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
