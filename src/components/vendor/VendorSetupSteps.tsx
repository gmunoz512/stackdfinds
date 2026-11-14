const STEPS = [
  { n: 1 as const, label: "Password" },
  { n: 2 as const, label: "Email", optional: true },
  { n: 3 as const, label: "Payout", optional: true },
];

/** First-login progress: password, optional email, optional payout details. */
export function VendorSetupSteps({ step }: { step: 1 | 2 | 3 }) {
  return (
    <ol className="va-progress" aria-label={`Step ${step} of 3`}>
      {STEPS.map((item) => {
        const done = item.n < step;
        const current = item.n === step;
        return (
          <li key={item.n} className={done ? "is-done" : current ? "is-current" : undefined} aria-current={current ? "step" : undefined}>
            <span className="va-progress-index" aria-hidden="true">
              {item.n}
            </span>
            <span>
              {item.label}
              {item.optional ? <span className="va-progress-optional"> optional</span> : null}
              {done ? <span className="sr-only">, done</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
