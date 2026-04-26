export default function HowScoringWorksPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">

      {/* Header */}
      <div className="mb-12">
        <p className="caps text-[color:var(--color-muted)] mb-3">Transparency</p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight mb-4"
          style={{ color: 'var(--color-ink)' }}>
          How company scores work
        </h1>
        <p className="text-lg leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>
          Every score on Aus Fair Go is calculated from real consumer outcomes —
          not advertising spend, not self-reported data. Here's exactly how it works.
        </p>
      </div>

      {/* Core philosophy */}
      <section className="card p-6 sm:p-8 mb-8">
        <h2 className="font-display text-2xl font-semibold mb-4" style={{ color: 'var(--color-ink)' }}>
          The core philosophy
        </h2>
        <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>
          <p>
            A company's score is driven entirely by <strong style={{ color: 'var(--color-ink)' }}>what consumers say happened</strong> —
            not what the company claims. Did the issue get resolved? Would the consumer deal with them again?
            What star rating did they give?
          </p>
          <p>
            Responding to complaints earns a small bonus, but it is not enough on its own.
            A company that responds to every complaint but never actually resolves them will still receive a low score.
          </p>
          <p>
            Only complaints from the <strong style={{ color: 'var(--color-ink)' }}>last 6 months</strong> count toward the score.
            This means recent behaviour matters more than old history — companies that improve are rewarded, and those that slip are held accountable.
          </p>
        </div>
      </section>

      {/* The formula */}
      <section className="mb-8">
        <h2 className="font-display text-2xl font-semibold mb-5" style={{ color: 'var(--color-ink)' }}>
          The formula
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--color-ink-2)' }}>
          The score is calculated out of 100 using four weighted signals:
        </p>

        <div className="space-y-4">
          {/* Resolution rate */}
          <div className="card p-5 sm:p-6 flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 font-display text-xl font-bold"
              style={{ background: 'var(--color-eucalyptus)', color: 'var(--color-paper)' }}>
              30%
            </div>
            <div>
              <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--color-ink)' }}>
                Resolution rate
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>
                The percentage of complaints where the consumer confirmed the issue was resolved.
                This is the single biggest factor — only the consumer can mark a complaint resolved,
                not the company.
              </p>
            </div>
          </div>

          {/* Star rating */}
          <div className="card p-5 sm:p-6 flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 font-display text-xl font-bold"
              style={{ background: 'var(--color-eucalyptus)', color: 'var(--color-paper)' }}>
              30%
            </div>
            <div>
              <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--color-ink)' }}>
                Consumer satisfaction rating
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>
                The average star rating (1–5) given by consumers when closing their complaint,
                normalised to a 0–100 scale. A 1★ rating contributes 0 points; a 5★ rating contributes
                full points. If no ratings have been submitted, this falls back to the resolution rate.
              </p>
            </div>
          </div>

          {/* Would deal again */}
          <div className="card p-5 sm:p-6 flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 font-display text-xl font-bold"
              style={{ background: 'var(--color-eucalyptus)', color: 'var(--color-paper)' }}>
              20%
            </div>
            <div>
              <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--color-ink)' }}>
                Would deal again
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>
                The percentage of consumers who said they would deal with the company again after
                their complaint experience. This measures confidence and overall trust, not just
                whether an issue was technically closed.
              </p>
            </div>
          </div>

          {/* Response rate */}
          <div className="card p-5 sm:p-6 flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 font-display text-xl font-bold"
              style={{ background: 'var(--color-paper-2)', color: 'var(--color-ink-2)' }}>
              20%
            </div>
            <div>
              <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--color-ink)' }}>
                Response rate
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>
                The percentage of complaints the company responded to. This is the smallest factor —
                responding is the bare minimum, not a achievement. A company that responds to less than
                10% of complaints receives a score of 0 regardless of other signals.
              </p>
            </div>
          </div>
        </div>

        {/* Formula display */}
        <div className="mt-6 p-5 rounded-2xl font-mono text-sm"
          style={{ background: 'var(--color-paper-2)', color: 'var(--color-ink-2)', border: '1px solid var(--color-line)' }}>
          <p className="text-xs caps text-[color:var(--color-muted)] mb-3">Final formula</p>
          <p style={{ color: 'var(--color-ink)' }}>
            Score = (Resolution × 0.30) + (Satisfaction × 0.30) + (Would deal again × 0.20) + (Response × 0.20)
          </p>
          <p className="mt-1.5 text-xs" style={{ color: 'var(--color-muted)' }}>
            Result multiplied by 100 → final score 0–100
          </p>
        </div>
      </section>

      {/* Score bands */}
      <section className="mb-8">
        <h2 className="font-display text-2xl font-semibold mb-5" style={{ color: 'var(--color-ink)' }}>
          Score bands
        </h2>
        <div className="space-y-3">
          {[
            { label: 'Excellent',     range: '76 – 100', color: '#2d6a4f', bg: '#d8f3dc', desc: 'Consistently resolves complaints and earns strong consumer satisfaction.' },
            { label: 'Good',          range: '51 – 75',  color: '#1d3557', bg: '#cce8ff', desc: 'Responds well and resolves most complaints with positive consumer outcomes.' },
            { label: 'Fair',          range: '26 – 50',  color: '#b5620a', bg: '#fff3cd', desc: 'Room for improvement — some complaints are resolved but satisfaction is mixed.' },
            { label: 'Poor',          range: '1 – 25',   color: '#9b1c1c', bg: '#fde8e8', desc: 'Struggles to resolve complaints. Consumers report low satisfaction.' },
            { label: 'Not yet rated', range: '—',        color: 'var(--color-muted)', bg: 'var(--color-paper-2)', desc: 'Fewer than 5 complaints on record. Not enough data to generate a reliable score.' },
          ].map((b) => (
            <div key={b.label} className="card p-4 flex items-center gap-4">
              <span className="text-xs font-bold px-3 py-1 rounded-full shrink-0 w-28 text-center"
                style={{ color: b.color, background: b.bg }}>
                {b.label}
              </span>
              <span className="font-mono text-sm font-semibold w-20 shrink-0"
                style={{ color: 'var(--color-ink)' }}>
                {b.range}
              </span>
              <p className="text-sm" style={{ color: 'var(--color-ink-2)' }}>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Verified badge */}
      <section className="card p-6 sm:p-8 mb-8"
        style={{ borderLeft: '4px solid var(--color-eucalyptus)' }}>
        <h2 className="font-display text-2xl font-semibold mb-4" style={{ color: 'var(--color-ink)' }}>
          ✓ Verified badge
        </h2>
        <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--color-ink-2)' }}>
          The Aus Fair Go Verified badge is awarded to companies that meet all of the following criteria
          based on their last 6 months of activity:
        </p>
        <ul className="space-y-2.5">
          {[
            ['Response rate',   '90% or above'],
            ['Resolution rate', '90% or above'],
            ['Would deal again','70% or above'],
            ['Average rating',  '3.5 / 5 or above'],
            ['Minimum complaints', 'At least 20 on record'],
            ['Account age',     'Registered for at least 6 months'],
          ].map(([label, value]) => (
            <li key={label} className="flex items-center justify-between text-sm py-2"
              style={{ borderBottom: '1px solid var(--color-line)' }}>
              <span style={{ color: 'var(--color-ink-2)' }}>{label}</span>
              <span className="font-semibold" style={{ color: 'var(--color-eucalyptus)' }}>{value}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs mt-5" style={{ color: 'var(--color-muted)' }}>
          The badge is automatically removed if a company falls below any threshold. It is recalculated
          every time a new complaint is filed or a consumer submits feedback.
        </p>
      </section>

      {/* Not recommended */}
      <section className="card p-6 sm:p-8 mb-8"
        style={{ borderLeft: '4px solid var(--color-clay)' }}>
        <h2 className="font-display text-2xl font-semibold mb-4" style={{ color: 'var(--color-ink)' }}>
          ⚠ Not recommended flag
        </h2>
        <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-ink-2)' }}>
          A company is flagged as <strong>Not Recommended</strong> when it has at least 5 complaints on record and meets either of these conditions:
        </p>
        <ul className="space-y-2 text-sm" style={{ color: 'var(--color-ink-2)' }}>
          <li className="flex items-start gap-2">
            <span style={{ color: 'var(--color-clay)' }}>•</span>
            Score is below 30 out of 100
          </li>
          <li className="flex items-start gap-2">
            <span style={{ color: 'var(--color-clay)' }}>•</span>
            Response rate is below 30% — meaning the company ignores most complaints
          </li>
        </ul>
        <p className="text-xs mt-4" style={{ color: 'var(--color-muted)' }}>
          The flag is automatically removed if the company improves above both thresholds.
        </p>
      </section>

      {/* Minimum threshold */}
      <section className="card p-6 sm:p-8 mb-8">
        <h2 className="font-display text-2xl font-semibold mb-4" style={{ color: 'var(--color-ink)' }}>
          Minimum complaint threshold
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>
          A minimum of <strong style={{ color: 'var(--color-ink)' }}>5 complaints</strong> within the last 6 months is required before
          a score is generated. This prevents a single bad experience — or a single glowing review — from
          defining a company's reputation unfairly. Until the threshold is reached, the profile shows
          "Not yet rated."
        </p>
      </section>

      {/* Fairness note */}
      <section className="p-6 rounded-2xl text-sm leading-relaxed"
        style={{ background: 'var(--color-paper-2)', color: 'var(--color-ink-2)', border: '1px solid var(--color-line)' }}>
        <p className="font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>A note on fairness</p>
        <p>
          Aus Fair Go does not accept payment from companies to alter, hide, or improve their score.
          Every score is calculated automatically from verified consumer interactions.
          Companies can improve their score only by genuinely resolving complaints and earning positive
          consumer feedback — nothing else.
        </p>
      </section>

    </div>
  )
}
