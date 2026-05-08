"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CATEGORIES,
  categoryLabel,
  type CategoryValue,
} from "@/lib/categories";

type Prediction = {
  placeId: string;
  mainText: string;
  secondaryText: string;
};

type SelectedPlace = {
  placeId: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  photoUrl: string | null;
  suggestedCategory: CategoryValue;
  existing: { id: string; status: "pending" | "live" | "rejected" } | null;
};

type Step = "search" | "confirm" | "category" | "questions" | "review" | "done";

const MIN_LEN = 20;
const MAX_LEN = 500;

const QUESTIONS = [
  {
    key: "specialToYou" as const,
    label: "What makes this place special to you?",
  },
  { key: "energy" as const, label: "What gives this place its energy?" },
  {
    key: "whatToDo" as const,
    label: "What's one thing a visitor should do or experience here?",
  },
];

export function AddPlaceForm() {
  const [step, setStep] = useState<Step>("search");
  const [selected, setSelected] = useState<SelectedPlace | null>(null);
  const [category, setCategory] = useState<CategoryValue | null>(null);
  const [answers, setAnswers] = useState({
    specialToYou: "",
    energy: "",
    whatToDo: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<{
    createdNewPlace: boolean;
  } | null>(null);

  const skipCategory = !!selected?.existing;
  const effectiveCategory = skipCategory ? null : category;

  const handleSelectPrediction = async (placeId: string) => {
    setSubmitError(null);
    try {
      const res = await fetch(
        `/api/places/google-details?placeId=${encodeURIComponent(placeId)}`,
      );
      if (!res.ok) throw new Error(`Could not load place (${res.status})`);
      const data = (await res.json()) as SelectedPlace;
      setSelected(data);
      setCategory(data.suggestedCategory);
      setStep("confirm");
    } catch (e) {
      setSubmitError((e as Error).message);
    }
  };

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googlePlaceId: selected.placeId,
          category: skipCategory ? null : category,
          specialToYou: answers.specialToYou.trim(),
          energy: answers.energy.trim(),
          whatToDo: answers.whatToDo.trim(),
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? `Submission failed (${res.status})`);
      }
      const data = (await res.json()) as { createdNewPlace: boolean };
      setSubmitResult(data);
      setStep("done");
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "search") {
    return (
      <SearchStep
        onPick={(p) => {
          setSelected(null);
          handleSelectPrediction(p.placeId);
        }}
        error={submitError}
      />
    );
  }

  if (step === "confirm" && selected) {
    return (
      <ConfirmStep
        place={selected}
        onBack={() => {
          setStep("search");
          setSelected(null);
        }}
        onContinue={() =>
          setStep(skipCategory ? "questions" : "category")
        }
      />
    );
  }

  if (step === "category" && selected) {
    return (
      <CategoryStep
        value={category}
        onChange={setCategory}
        onBack={() => setStep("confirm")}
        onContinue={() => setStep("questions")}
      />
    );
  }

  if (step === "questions" && selected) {
    return (
      <QuestionsStep
        answers={answers}
        onChange={setAnswers}
        onBack={() => setStep(skipCategory ? "confirm" : "category")}
        onContinue={() => setStep("review")}
      />
    );
  }

  if (step === "review" && selected) {
    return (
      <ReviewStep
        place={selected}
        category={effectiveCategory}
        skipCategory={skipCategory}
        answers={answers}
        submitting={submitting}
        error={submitError}
        onBack={() => setStep("questions")}
        onSubmit={handleSubmit}
      />
    );
  }

  if (step === "done" && submitResult) {
    return <DoneStep result={submitResult} alreadyExists={!!selected?.existing} />;
  }

  return null;
}

function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-xl">
      <h1 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
        {title}
      </h1>
      {subtitle && (
        <p className="text-ink-soft mt-3 leading-relaxed">{subtitle}</p>
      )}
      <div className="mt-10">{children}</div>
    </div>
  );
}

function SearchStep({
  onPick,
  error,
}: {
  onPick: (p: Prediction) => void;
  error: string | null;
}) {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<number | null>(null);

  useEffect(() => {
    if (debounce.current) window.clearTimeout(debounce.current);
    let cancelled = false;
    debounce.current = window.setTimeout(() => {
      if (query.trim().length < 2) {
        if (!cancelled) {
          setPredictions([]);
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      fetch(`/api/places/autocomplete?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((d: { predictions: Prediction[] }) => {
          if (!cancelled) setPredictions(d.predictions ?? []);
        })
        .catch(() => {
          if (!cancelled) setPredictions([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 280);
    return () => {
      cancelled = true;
      if (debounce.current) window.clearTimeout(debounce.current);
    };
  }, [query]);

  return (
    <StepShell
      title="What place?"
      subtitle="Search for somewhere you've felt something."
    >
      <input
        type="text"
        autoFocus
        autoComplete="off"
        placeholder="A café, a park, a hotel…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border-rule focus:border-sage w-full rounded-md border bg-white px-4 py-3 text-base outline-none transition-colors"
      />

      {loading && (
        <p className="text-ink-soft mt-3 text-sm">Finding places…</p>
      )}

      {!loading && predictions.length > 0 && (
        <ul className="border-rule/60 mt-3 divide-y divide-current/10 overflow-hidden rounded-md border bg-white">
          {predictions.map((p) => (
            <li key={p.placeId}>
              <button
                type="button"
                onClick={() => onPick(p)}
                className="hover:bg-paper-deep w-full px-4 py-3 text-left transition-colors"
              >
                <div className="font-medium">{p.mainText}</div>
                {p.secondaryText && (
                  <div className="text-ink-soft text-sm">
                    {p.secondaryText}
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <div className="mt-10">
        <Link
          href="/"
          className="text-ink-soft hover:text-ink text-sm transition-colors"
        >
          ← Back to map
        </Link>
      </div>
    </StepShell>
  );
}

function ConfirmStep({
  place,
  onBack,
  onContinue,
}: {
  place: SelectedPlace;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <StepShell title="Is this the place?">
      {place.photoUrl && (
        <div className="bg-paper-deep relative mb-6 aspect-[4/3] w-full overflow-hidden rounded-md">
          <Image
            src={place.photoUrl}
            alt={place.name}
            fill
            sizes="(max-width: 768px) 100vw, 576px"
            className="object-cover"
          />
        </div>
      )}
      <p className="font-serif text-2xl leading-tight">{place.name}</p>
      {place.address && (
        <p className="text-ink-soft mt-2 text-sm">{place.address}</p>
      )}

      {place.existing?.status === "live" && (
        <div className="bg-paper-deep mt-6 rounded-md p-4 text-sm leading-relaxed">
          This place is already on the map — you&apos;re adding your
          perspective.
        </div>
      )}
      {place.existing?.status === "pending" && (
        <div className="bg-paper-deep mt-6 rounded-md p-4 text-sm leading-relaxed">
          This place is being reviewed. You can add your perspective and
          it&apos;ll be reviewed alongside it.
        </div>
      )}

      <FormNav onBack={onBack} backLabel="Search again" onContinue={onContinue} continueLabel="Yes, that's it" />
    </StepShell>
  );
}

function CategoryStep({
  value,
  onChange,
  onBack,
  onContinue,
}: {
  value: CategoryValue | null;
  onChange: (v: CategoryValue) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <StepShell
      title="What kind of place is it?"
      subtitle="Pick the closest fit."
    >
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const selected = value === c.value;
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => onChange(c.value)}
              className={
                selected
                  ? "border-sage bg-sage rounded-full border px-4 py-2 text-sm text-white transition-colors"
                  : "border-rule hover:border-ink/30 rounded-full border bg-white px-4 py-2 text-sm transition-colors"
              }
            >
              {c.label}
            </button>
          );
        })}
      </div>
      <FormNav
        onBack={onBack}
        onContinue={onContinue}
        continueDisabled={!value}
      />
    </StepShell>
  );
}

function QuestionsStep({
  answers,
  onChange,
  onBack,
  onContinue,
}: {
  answers: { specialToYou: string; energy: string; whatToDo: string };
  onChange: (
    next: { specialToYou: string; energy: string; whatToDo: string },
  ) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const allValid = useMemo(
    () =>
      QUESTIONS.every((q) => {
        const v = answers[q.key].trim();
        return v.length >= MIN_LEN && v.length <= MAX_LEN;
      }),
    [answers],
  );

  return (
    <StepShell
      title="Tell us about it."
      subtitle="A few sentences each is plenty."
    >
      <div className="space-y-8">
        {QUESTIONS.map((q) => (
          <Field
            key={q.key}
            label={q.label}
            value={answers[q.key]}
            onChange={(v) => onChange({ ...answers, [q.key]: v })}
          />
        ))}
      </div>
      <FormNav
        onBack={onBack}
        onContinue={onContinue}
        continueDisabled={!allValid}
        continueLabel="Review"
      />
    </StepShell>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const trimmed = value.trim();
  const len = trimmed.length;
  const tooShort = len > 0 && len < MIN_LEN;
  const tooLong = len > MAX_LEN;
  return (
    <div>
      <label className="text-ink mb-2 block text-sm">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="border-rule focus:border-sage w-full rounded-md border bg-white px-4 py-3 leading-relaxed outline-none transition-colors"
      />
      <div className="text-ink-soft mt-1.5 flex justify-between text-xs">
        <span className={tooShort || tooLong ? "text-red-700" : ""}>
          {tooShort && `A little more — at least ${MIN_LEN} characters.`}
          {tooLong && `A little less — under ${MAX_LEN} characters.`}
        </span>
        <span>
          {len}/{MAX_LEN}
        </span>
      </div>
    </div>
  );
}

function ReviewStep({
  place,
  category,
  skipCategory,
  answers,
  submitting,
  error,
  onBack,
  onSubmit,
}: {
  place: SelectedPlace;
  category: CategoryValue | null;
  skipCategory: boolean;
  answers: { specialToYou: string; energy: string; whatToDo: string };
  submitting: boolean;
  error: string | null;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <StepShell title="Anything you want to change?">
      <div className="border-rule/60 space-y-6 rounded-md border bg-white p-6">
        <div>
          <p className="text-ink-soft mb-1 text-xs tracking-wide uppercase">
            Place
          </p>
          <p className="font-medium">{place.name}</p>
          {place.address && (
            <p className="text-ink-soft text-sm">{place.address}</p>
          )}
        </div>
        {!skipCategory && category && (
          <div>
            <p className="text-ink-soft mb-1 text-xs tracking-wide uppercase">
              Category
            </p>
            <p>{categoryLabel(category)}</p>
          </div>
        )}
        {QUESTIONS.map((q) => (
          <div key={q.key}>
            <p className="text-ink-soft mb-1 text-xs tracking-wide uppercase">
              {q.label}
            </p>
            <p className="leading-relaxed">{answers[q.key]}</p>
          </div>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <FormNav
        onBack={onBack}
        onContinue={onSubmit}
        continueLabel={submitting ? "Sending…" : "Submit"}
        continueDisabled={submitting}
      />
    </StepShell>
  );
}

function DoneStep({
  result,
  alreadyExists,
}: {
  result: { createdNewPlace: boolean };
  alreadyExists: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-xl text-center">
      <h1 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
        Thanks. We&apos;ll take a look soon.
      </h1>
      <p className="text-ink-soft mt-6 leading-relaxed">
        {alreadyExists
          ? "Your perspective will be reviewed and added to the place page."
          : result.createdNewPlace
            ? "We'll review your submission and let you know when it's live. You'll usually hear back within a day."
            : "Your perspective will be reviewed and added to the place page."}
      </p>
      <div className="mt-10">
        <Link
          href="/"
          className="text-ink-soft hover:text-ink text-sm transition-colors"
        >
          ← Back to map
        </Link>
      </div>
    </div>
  );
}

function FormNav({
  onBack,
  backLabel = "Back",
  onContinue,
  continueLabel = "Continue",
  continueDisabled = false,
}: {
  onBack: () => void;
  backLabel?: string;
  onContinue: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
}) {
  return (
    <div className="mt-10 flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        className="text-ink-soft hover:text-ink text-sm transition-colors"
      >
        ← {backLabel}
      </button>
      <button
        type="button"
        onClick={onContinue}
        disabled={continueDisabled}
        className="bg-sage hover:bg-sage/90 rounded-md px-5 py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40"
      >
        {continueLabel}
      </button>
    </div>
  );
}
