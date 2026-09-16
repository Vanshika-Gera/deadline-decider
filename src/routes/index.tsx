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

type Verdict = "fine" | "tight" | "crunch" | "cooked" | "math";

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

  if (!Number.isFinite(total) || total <= 0) return null;
  if (!Number.isFinite(completed) || completed < 0) return null;
  if (!Number.isFinite(days) || days <= 0) return null;
  if (!Number.isFinite(hoursPerDay) || hoursPerDay <= 0) return null;
  if (!Number.isFinite(speed) || speed <= 0) return null;

  const remaining = total - completed;
  const availableHours = days * hoursPerDay;
  const requiredDaily = remaining / days;
  const requiredHourly = remaining / availableHours;
  const timeNeeded = remaining / speed;
  const progressPercent = (completed / total) * 100;

  const paceRatio = requiredHourly / speed;

  let verdict: Verdict;
  let verdictTitle: string;
  let verdictMessage: string;

  if (remaining === 0) {
    verdict = "fine";
    verdictTitle = "You're done.";
    verdictMessage = "Nothing left to do. You survived.";
  } else if (paceRatio <= 0.7) {
    verdict = "fine";
    verdictTitle = "You're fine.";
    verdictMessage = `You need ${formatNumber(
      requiredHourly
    )} ${unit}/hour — well below your usual ${formatNumber(
      speed
    )}/hour pace.`;
  } else if (paceRatio <= 1.0) {
    verdict = "tight";
    verdictTitle = "Getting tight.";
    verdictMessage = `You need ${formatNumber(
      requiredHourly
    )} ${unit}/hour to match your usual ${formatNumber(
      speed
    )}/hour pace. Stay focused.`;
  } else if (paceRatio <= 1.3) {
    verdict = "crunch";
    verdictTitle = "Crunch time.";
    verdictMessage = `You need ${formatNumber(
      requiredHourly
    )} ${unit}/hour — ${formatNumber(
      paceRatio
    )}× your usual pace. Push hard.`;
  } else {
    verdict = "cooked";
    verdictTitle = "You are cooked.";
    verdictMessage = `You need ${formatNumber(
      requiredHourly
    )} ${unit}/hour — ${formatNumber(
      paceRatio
    )}× your usual pace. Something has to give.`;
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

function createMathResult(
  title: string,
  message: string,
  unit: string
): CalculationResult {
  return {
    remaining: 0,
    requiredDaily: 0,
    requiredHourly: 0,
    timeNeeded: 0,
    availableHours: 0,
    progressPercent: 0,
    unit,
    verdict: "math",
    verdictTitle: title,
    verdictMessage: message,
  };
}

function formatNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

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
    if (selectedUnit === "custom") return customUnit.trim() || "items";
    return selectedUnit;
  }, [selectedUnit, customUnit]);

  function updateInput(key: keyof typeof inputs, value: string) {
    setInputs((prev) => ({
      ...prev,
      [key]: value,
    }));
    setError(null);
  }

  function handleReset() {
    setInputs(defaultInputs);
    setSelectedUnit("pages");
    setCustomUnit("");
    setResult(null);
    setError(null);
    setShowResult(false);
  }

  function handleCalculate() {
    const total = parseFloat(inputs.total);
    const completed = parseFloat(inputs.completed);
    const days = parseFloat(inputs.days);
    const hoursPerDay = parseFloat(inputs.hoursPerDay);
    const speed = parseFloat(inputs.speed);

    if (
      !Number.isFinite(total) ||
      !Number.isFinite(completed) ||
      !Number.isFinite(days) ||
      !Number.isFinite(hoursPerDay) ||
      !Number.isFinite(speed)
    ) {
      setError("Please fill in all fields with valid numbers.");
      setShowResult(false);
      setResult(null);
      return;
    }

    if (selectedUnit === "custom" && !customUnit.trim()) {
      setError("Please enter a custom unit (e.g. words, slides).");
      setShowResult(false);
      setResult(null);
      return;
    }

    if (total <= 0) {
      setResult(
        createMathResult(
          "Your maths is cooked.",
          "A workload of zero doesn't exactly require a panic calculator. Try entering some actual work.",
          activeUnit
        )
      );
      setShowResult(true);
      setError(null);
      return;
    }

    if (completed < 0) {
      setResult(
        createMathResult(
          "You completed WHAT?",
          `Negative ${activeUnit} completed is a little beyond our current understanding of mathematics.`,
          activeUnit
        )
      );
      setShowResult(true);
      setError(null);
      return;
    }

    if (completed > total) {
      setResult(
        createMathResult(
          "Your maths is cooked.",
          `You somehow completed ${formatNumber(
            completed
          )} ${activeUnit} out of ${formatNumber(
            total
          )} ${activeUnit}. Impressive. Concerning. Please check your numbers.`,
          activeUnit
        )
      );
      setShowResult(true);
      setError(null);
      return;
    }

    if (days <= 0) {
      setResult(
        createMathResult(
          "Time is apparently optional.",
          "You gave yourself zero days. Unfortunately, deadlines remain annoyingly attached to the concept of time.",
          activeUnit
        )
      );
      setShowResult(true);
      setError(null);
      return;
    }

    if (hoursPerDay <= 0) {
      setResult(
        createMathResult(
          "Those are some impressive study hours.",
          "You entered zero hours per day. Unless you're planning to finish everything telepathically, try again.",
          activeUnit
        )
      );
      setShowResult(true);
      setError(null);
      return;
    }

    if (hoursPerDay > 24) {
      setResult(
        createMathResult(
          "You are not studying. You are becoming the textbook.",
          "There are only 24 hours in a day. I checked.",
          activeUnit
        )
      );
      setShowResult(true);
      setError(null);
      return;
    }

    if (speed <= 0) {
      setResult(
        createMathResult(
          "At this speed, we're both cooked.",
          "Your estimated working speed is zero. The deadline is not going to wait for you to discover teleportation.",
          activeUnit
        )
      );
      setShowResult(true);
      setError(null);
      return;
    }

    if (total >= 10000 && days <= 1) {
      setResult(
        createMathResult(
          "Bestie. Be so for real.",
          `${formatNumber(
            total
          )} ${activeUnit} in ${formatNumber(
            days
          )} day? This is no longer a productivity problem.`,
          activeUnit
        )
      );
      setShowResult(true);
      setError(null);
      return;
    }

    if (speed >= 1000) {
      setResult(
        createMathResult(
          "Okay, Superman.",
          `${formatNumber(
            speed
          )} ${activeUnit}/hour? Either you're incredibly efficient or something has gone horribly wrong.`,
          activeUnit
        )
      );
      setShowResult(true);
      setError(null);
      return;
    }

    const outcome = calculateDeadline({
      total,
      completed,
      days,
      hoursPerDay,
      speed,
      unit: activeUnit,
    });

    if (!outcome) {
      setError("Something went wrong while calculating your deadline.");
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
              <p
                role="alert"
                className="mt-4 text-sm text-verdict-cooked"
              >
                {error}
              </p>
            )}

            <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto]">
              <button
                type="button"
                onClick={handleCalculate}
                className="w-full rounded-xl bg-gradient-to-r from-primary to-[#a855f7] py-3.5 font-display font-semibold text-white shadow-lg shadow-primary/30 transition hover:brightness-110"
              >
                Calculate my fate
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl border border-white/15 bg-white/5 px-5 py-3.5 font-display font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                Reset
              </button>
            </div>
          </section>

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

                {result.verdict !== "math" && (
                  <>
                    <ProgressBar result={result} />
                    <StatsGrid result={result} />
                  </>
                )}
              </div>
            ) : null}
          </section>
        </div>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-xl">
          <h2 className="text-center font-display text-2xl font-bold text-white">
            What does "cooked" actually mean?
          </h2>

          <p className="mt-2 text-center text-sm text-white/40">
            The verdict is based on how your required pace compares with your
            usual pace.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-verdict-fine/30 bg-verdict-fine/10 p-4">
              <div className="font-display text-lg font-bold text-verdict-fine">
                You&apos;re fine.
              </div>

              <p className="mt-2 text-sm leading-relaxed text-white/55">
                You have plenty of room to finish at your current pace.
              </p>
            </div>

            <div className="rounded-2xl border border-verdict-tight/30 bg-verdict-tight/10 p-4">
              <div className="font-display text-lg font-bold text-verdict-tight">
                Getting tight.
              </div>

              <p className="mt-2 text-sm leading-relaxed text-white/55">
                You can still finish, but you&apos;ll need to stay consistent.
              </p>
            </div>

            <div className="rounded-2xl border border-verdict-crunch/30 bg-verdict-crunch/10 p-4">
              <div className="font-display text-lg font-bold text-verdict-crunch">
                Crunch time.
              </div>

              <p className="mt-2 text-sm leading-relaxed text-white/55">
                You can finish, but you&apos;ll need to work harder than your
                usual pace.
              </p>
            </div>

            <div className="rounded-2xl border border-verdict-cooked/30 bg-verdict-cooked/10 p-4">
              <div className="font-display text-lg font-bold text-verdict-cooked">
                You are cooked.
              </div>

              <p className="mt-2 text-sm leading-relaxed text-white/55">
                At your current pace, you can&apos;t finish everything before
                the deadline.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

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
          <span className="whitespace-nowrap text-sm text-white/40">
            {unit}
          </span>
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

        <span className="whitespace-nowrap text-sm text-white/40">
          {unit}
        </span>
      </div>
    </label>
  );
}

function VerdictCard({ result }: { result: CalculationResult }) {
  const verdictStyles: Record<Verdict, string> = {
    fine: "border-verdict-fine/40 bg-verdict-fine/10 text-verdict-fine",
    tight: "border-verdict-tight/40 bg-verdict-tight/10 text-verdict-tight",
    crunch:
      "border-verdict-crunch/40 bg-verdict-crunch/10 text-verdict-crunch",
    cooked:
      "border-verdict-cooked/40 bg-verdict-cooked/10 text-verdict-cooked",
    math: "border-purple-400/40 bg-purple-400/10 text-purple-300",
  };

  return (
    <div
      className={`rounded-2xl border p-5 ${verdictStyles[result.verdict]}`}
    >
      <div className="text-[11px] uppercase tracking-[0.2em] opacity-80">
        {result.verdict === "math" ? "Math emergency" : "Panic report"}
      </div>

      <div className="mt-1 font-display text-4xl font-extrabold text-white">
        {result.verdictTitle}
      </div>

      <p className="mt-2 text-sm text-white/60">
        {result.verdictMessage}
      </p>
    </div>
  );
}

function ProgressBar({ result }: { result: CalculationResult }) {
  const completedPercent = Math.min(
    Math.max(result.progressPercent, 0),
    100
  );

  const remainingPercent = 100 - completedPercent;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 flex justify-between text-xs text-white/50">
        <span>Completed</span>
        <span>Remaining</span>
      </div>

      <div className="flex h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className="progress-fill h-full bg-verdict-fine"
          style={{ width: `${completedPercent}%` }}
        />

        <div
          className="progress-fill h-full bg-verdict-cooked/70"
          style={{
            width: `${remainingPercent}%`,
            animationDelay: "0.15s",
          }}
        />
      </div>

      <div className="mt-2 flex justify-between text-xs text-white/40">
        <span>{formatNumber(completedPercent)}% done</span>
        <span>{formatNumber(remainingPercent)}% left</span>
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
            <span className="text-sm font-normal text-white/40">
              {stat.unit}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}