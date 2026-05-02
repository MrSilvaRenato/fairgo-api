import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import useAuthStore from '../../store/authStore';

const PROOF_TYPES = [
  { value: 'asic_extract',          label: 'ASIC Company Extract'             },
  { value: 'director_certificate',  label: 'Certificate of Appointment / Director Certificate' },
  { value: 'employment_contract',   label: 'Employment Contract (showing role)' },
  { value: 'business_card',         label: 'Business Card + LinkedIn profile'  },
  { value: 'other',                 label: 'Other (describe in your message)'  },
];

export default function ClaimPage() {
  const { slug }   = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuthStore();

  const [company,  setCompany]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState('');
  const [fieldErr, setFieldErr] = useState({});

  const [form, setForm] = useState({
    claimant_name:     '',
    claimant_email:    '',
    claimant_position: '',
    claimant_phone:    '',
    abn_confirmation:  '',
    proof_type:        '',
    message:           '',
  });
  const [proofFile, setProofFile] = useState(null);

  useEffect(() => {
    api.get(`/companies/${slug}`)
      .then(r => {
        const c = r.data.company ?? r.data;
        setCompany(c);
        // Pre-fill name and email from logged-in user
        if (user) {
          setForm(f => ({
            ...f,
            claimant_name:  user.name  ?? '',
            claimant_email: user.email ?? '',
          }));
        }
      })
      .catch(() => setError('Company not found.'))
      .finally(() => setLoading(false));
  }, [slug, user]);

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setFieldErr(fe => ({ ...fe, [field]: null }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setFieldErr({});
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([k, v]) => payload.append(k, v));
      if (proofFile) payload.append('proof_document', proofFile);
      await api.post(`/companies/${company.id}/claim`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess(true);
    } catch (err) {
      if (err.response?.status === 422) {
        setFieldErr(err.response.data.errors ?? {});
        setError(err.response.data.message ?? 'Please fix the errors below.');
      } else {
        setError(err.response?.data?.message ?? 'Something went wrong. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Live domain match check
  const emailDomain = form.claimant_email.includes('@')
    ? form.claimant_email.split('@')[1]?.toLowerCase().replace(/^www\./, '')
    : null;
  const siteDomain = company?.website
    ? (() => { try { return new URL(company.website).hostname.replace(/^www\./, '').toLowerCase(); } catch { return company.website.replace(/^www\./, '').toLowerCase(); } })()
    : null;
  const domainMatchStatus = emailDomain && siteDomain
    ? (emailDomain === siteDomain ? 'match' : 'mismatch')
    : null;

  // ── Loading ──────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[color:var(--color-eucalyptus)]" />
    </div>
  );

  if (error && !company) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-[color:var(--color-clay)] mb-4">{error}</p>
        <Link to="/" className="text-[color:var(--color-eucalyptus)] underline">Go home</Link>
      </div>
    </div>
  );

  // ── Not logged in — gate ─────────────────────────────────
  if (!user) return (
    <div className="min-h-screen bg-[color:var(--color-bg)] flex items-center justify-center p-4">
      <div className="bg-[color:var(--color-card)] rounded-2xl shadow-sm border hairline-2 max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-[color:var(--color-eucalyptus-3)] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🏢</span>
        </div>
        <h2 className="font-display text-xl font-semibold text-[color:var(--color-ink)] mb-2">
          Sign in to claim {company?.name}
        </h2>
        <p className="text-sm text-[color:var(--color-muted)] mb-5 leading-relaxed">
          You need a free Aus Fair Go account to submit a claim. Once our team approves it,
          your account is automatically upgraded to a <strong>business owner</strong> account
          with full access to your company dashboard.
        </p>

        {/* How it works steps */}
        <div className="text-left bg-[color:var(--color-paper-2)] rounded-xl p-4 mb-6 space-y-2.5">
          {[
            { n: '1', text: 'Create a free account (takes 30 seconds)' },
            { n: '2', text: 'Fill in the claim form with your ABN and role' },
            { n: '3', text: 'Our team reviews and approves within 2 business days' },
            { n: '4', text: 'You get notified and gain full dashboard access' },
          ].map(s => (
            <div key={s.n} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white"
                style={{ background: 'var(--color-eucalyptus)' }}>{s.n}</span>
              <p className="text-xs text-[color:var(--color-ink-2)]">{s.text}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <Link
            to={`/register?next=/companies/${slug}/claim`}
            className="btn btn-primary w-full justify-center py-3"
          >
            Create a free account →
          </Link>
          <Link
            to={`/login?next=/companies/${slug}/claim`}
            className="btn btn-secondary w-full justify-center py-3"
          >
            I already have an account — Sign in
          </Link>
        </div>
        <p className="text-xs text-[color:var(--color-muted)] mt-4">
          Free forever · No credit card required
        </p>
      </div>
    </div>
  );

  // ── Success ───────────────────────────────────────────────
  if (success) return (
    <div className="min-h-screen bg-[color:var(--color-bg)] flex items-center justify-center p-4">
      <div className="bg-[color:var(--color-card)] rounded-2xl shadow-sm border hairline-2 max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="font-display text-xl font-semibold text-[color:var(--color-ink)] mb-2">Claim Submitted!</h2>
        <p className="text-sm text-[color:var(--color-muted)] mb-2 leading-relaxed">
          Our team will review your request within 2 business days.
        </p>
        <p className="text-sm text-[color:var(--color-muted)] mb-6 leading-relaxed">
          You'll see the result in your <strong>dashboard</strong> — we'll notify you there whether it's approved or rejected.
        </p>
        <div className="flex flex-col gap-3">
          <Link to="/dashboard" className="btn btn-primary w-full justify-center">
            Go to my dashboard
          </Link>
          <Link to={`/companies/${slug}`} className="btn btn-secondary w-full justify-center">
            Back to {company?.name}
          </Link>
        </div>
      </div>
    </div>
  );

  const isClaimed = company?.claimed;

  return (
    <div className="min-h-screen bg-[color:var(--color-bg)] py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Breadcrumb */}
        <nav className="text-sm text-[color:var(--color-muted)] mb-6 flex items-center gap-1.5">
          <Link to="/" className="hover:underline">Home</Link>
          <span>›</span>
          <Link to={`/companies/${slug}`} className="hover:underline">{company?.name}</Link>
          <span>›</span>
          <span>Claim this business</span>
        </nav>

        {isClaimed && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex gap-3">
            <span className="text-amber-500 text-lg mt-0.5">⚠️</span>
            <div>
              <p className="font-semibold text-amber-800">This business has already been claimed</p>
              <p className="text-sm text-amber-700 mt-0.5">
                If you believe this is incorrect, please{' '}
                <a href="mailto:hello@ausfairgo.com.au" className="underline">contact us</a>.
              </p>
            </div>
          </div>
        )}

        <div className="bg-[color:var(--color-card)] rounded-2xl shadow-sm border hairline-2 overflow-hidden">

          {/* Header */}
          <div className="p-6 border-b hairline-2">
            <div className="flex items-center gap-4">
              {company?.logo_url && (
                <img src={company.logo_url} alt={company.name}
                  className="w-14 h-14 rounded-xl bg-[color:var(--color-paper-2)] object-contain p-1"
                  onError={e => e.target.style.display = 'none'} />
              )}
              <div>
                <h1 className="font-display text-xl font-semibold text-[color:var(--color-ink)]">
                  Claim {company?.name}
                </h1>
                <p className="text-sm text-[color:var(--color-muted)] mt-0.5">
                  Prove you represent this business to access your company dashboard.
                </p>
              </div>
            </div>
          </div>

          {/* What you get */}
          <div className="bg-[color:var(--color-eucalyptus-3)] border-b hairline-2 px-6 py-4">
            <p className="text-sm font-semibold text-[color:var(--color-eucalyptus)] mb-2">Once approved, you can:</p>
            <ul className="grid sm:grid-cols-2 gap-1.5 text-sm text-[color:var(--color-ink-2)]">
              {[
                '✓ Respond to complaints publicly',
                '✓ View your company analytics',
                '✓ Get notified of new complaints',
                '✓ Display your Aus Fair Go score',
                '✓ Mark complaints as resolved',
                '✓ Upgrade to a Pro business account',
              ].map(item => <li key={item}>{item}</li>)}
            </ul>
          </div>

          {/* Logged in as */}
          <div className="px-6 py-3 bg-[color:var(--color-paper-2)] border-b hairline-2 flex items-center gap-2 text-sm">
            <span className="text-[color:var(--color-muted)]">Submitting as</span>
            <span className="font-medium text-[color:var(--color-ink)]">{user.name}</span>
            <span className="text-[color:var(--color-muted)]">·</span>
            <span className="text-[color:var(--color-muted)]">{user.email}</span>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="p-6 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-[color:var(--color-clay)]">
                {error}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Your full name *" error={fieldErr.claimant_name?.[0]}>
                <input type="text" value={form.claimant_name} onChange={set('claimant_name')}
                  placeholder="Jane Smith" required className="input" />
              </Field>
              <Field label="Business email *" error={fieldErr.claimant_email?.[0]}>
                <input type="email" value={form.claimant_email} onChange={set('claimant_email')}
                  placeholder="jane@company.com.au" required className="input" />
                {domainMatchStatus === 'match' && (
                  <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--color-eucalyptus)' }}>
                    <span>✓</span> Email domain matches company website
                  </p>
                )}
                {domainMatchStatus === 'mismatch' && (
                  <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#92400e' }}>
                    <span>⚠</span> Email domain doesn't match company website — that's OK, just ensure your proof is clear
                  </p>
                )}
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Job title / position *" error={fieldErr.claimant_position?.[0]}>
                <input type="text" value={form.claimant_position} onChange={set('claimant_position')}
                  placeholder="CEO, Owner, Legal Counsel…" required className="input" />
              </Field>
              <Field label="Phone number *" error={fieldErr.claimant_phone?.[0]}>
                <input type="tel" value={form.claimant_phone} onChange={set('claimant_phone')}
                  placeholder="+61 4XX XXX XXX" required className="input" />
              </Field>
            </div>

            <Field
              label="ABN confirmation *"
              hint={`Enter the 11-digit ABN registered for ${company?.name}. It must match our records.`}
              error={fieldErr.abn_confirmation?.[0]}
            >
              <input type="text" value={form.abn_confirmation} onChange={set('abn_confirmation')}
                placeholder="e.g. 78 624 472 980" required className="input" />
            </Field>

            <Field label="Proof of authority *" error={fieldErr.proof_type?.[0]}>
              <select value={form.proof_type} onChange={set('proof_type')} required className="input">
                <option value="">Select the type of proof you can provide…</option>
                {PROOF_TYPES.map(pt => (
                  <option key={pt.value} value={pt.value}>{pt.label}</option>
                ))}
              </select>
            </Field>

            <Field
              label="Supporting document (optional)"
              hint="Upload a PDF, image, or Word document to support your claim. Max 5 MB."
              error={fieldErr.proof_document?.[0]}
            >
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.docx"
                  onChange={e => {
                    setProofFile(e.target.files[0] ?? null);
                    setFieldErr(fe => ({ ...fe, proof_document: null }));
                  }}
                  className="block w-full text-sm text-[color:var(--color-muted)] file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:cursor-pointer cursor-pointer rounded-xl border px-3 py-2"
                  style={{ borderColor: 'var(--color-line)', background: 'var(--color-bg)' }}
                />
              </div>
              {proofFile && (
                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--color-eucalyptus)' }}>
                  <span>✓</span> {proofFile.name} ({(proofFile.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </Field>

            <Field
              label="Tell us about your role *"
              hint="Describe your authority to represent this business and mention any reference numbers (e.g. ASIC ACN). Min. 30 characters."
              error={fieldErr.message?.[0]}
            >
              <textarea value={form.message} onChange={set('message')} rows={4}
                placeholder="I am the registered director of [Company Name] (ACN: 123 456 789)…"
                required className="input resize-none" />
              <p className={`text-xs mt-1 ${form.message.length < 30 ? 'text-[color:var(--color-muted)]' : 'text-green-600'}`}>
                {form.message.length} / 30 minimum characters
              </p>
            </Field>

            <p className="text-xs text-[color:var(--color-muted)] bg-[color:var(--color-paper-2)] rounded-lg p-3">
              🔒 Your information is used only to verify your authority to manage this business profile. It will not be displayed publicly.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={saving || isClaimed}
                className="btn btn-primary flex-1 justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? 'Submitting…' : 'Submit Claim Request'}
              </button>
              <Link to={`/companies/${slug}`} className="btn btn-secondary py-3">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[color:var(--color-ink)] mb-1">{label}</label>
      {hint && <p className="text-xs text-[color:var(--color-muted)] mb-1.5">{hint}</p>}
      {children}
      {error && <p className="text-xs text-[color:var(--color-clay)] mt-1">{error}</p>}
    </div>
  );
}
