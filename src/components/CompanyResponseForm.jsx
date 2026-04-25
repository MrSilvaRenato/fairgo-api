import { useState, useRef, useEffect } from 'react'
import api from '../lib/axios'

/* ── Template definitions ─────────────────────────────────────────────────── */
const UNIVERSAL_TEMPLATES = [
  {
    id:      'ack_universal',
    tone:    'Acknowledgement',
    emoji:   '📋',
    title:   'We\'ve received your complaint',
    preview: 'Thank you for bringing this to our attention…',
    body: `Dear {consumer},

Thank you for taking the time to contact us regarding your recent experience. We have received your complaint (Ref: {ref}) and want to assure you that we take all feedback very seriously.

Our customer resolution team is currently reviewing the details of your case. We will be in touch within 2 business days with a full response and next steps.

We sincerely apologise for any inconvenience this matter has caused and appreciate your patience while we investigate.

Kind regards,
{company} Customer Relations`,
  },
  {
    id:      'info_needed',
    tone:    'Information Needed',
    emoji:   '🔍',
    title:   'We need a little more information',
    preview: 'To resolve this as quickly as possible, we need…',
    body: `Dear {consumer},

Thank you for filing complaint Ref: {ref}. We are committed to resolving this matter for you as quickly as possible.

To ensure we investigate thoroughly, could you please provide the following:
- The date the issue first occurred
- Any relevant order or account numbers
- Copies of any supporting documents or communications

Once we have this information, we will prioritise your case and keep you updated every step of the way.

Kind regards,
{company} Customer Relations`,
  },
]

const CATEGORY_TEMPLATES = {
  billing: [
    {
      id:      'billing_investigating',
      tone:    'Under Investigation',
      emoji:   '💳',
      title:   'Billing issue — investigating now',
      preview: 'We have identified a potential discrepancy…',
      body: `Dear {consumer},

Thank you for bringing this billing matter to our attention (Ref: {ref}).

We have reviewed your account and identified a potential discrepancy. Our billing team is conducting a full audit of the charges in question and we will have a confirmed outcome within 3–5 business days.

If an error is confirmed, a full refund or account credit will be processed immediately. You will receive written confirmation once the adjustment has been made.

We apologise for the confusion and any financial impact this may have caused.

Kind regards,
{company} Billing Team`,
    },
    {
      id:      'billing_refund_approved',
      tone:    'Refund Approved',
      emoji:   '✅',
      title:   'Billing — refund confirmed',
      preview: 'We have processed a refund to your account…',
      body: `Dear {consumer},

Thank you for your patience regarding complaint Ref: {ref}.

After a thorough review of your account, we have confirmed that an error occurred in the billing process. We sincerely apologise for this oversight.

A full refund has been approved and will be processed to your original payment method within 3–5 business days. You will receive a separate confirmation email once the transaction is complete.

We have also implemented a review of our billing processes to prevent this from occurring again.

Kind regards,
{company} Billing Team`,
    },
    {
      id:      'billing_charge_valid',
      tone:    'Charge Clarification',
      emoji:   '📄',
      title:   'Billing — charge explained',
      preview: 'After reviewing your account, the charge relates to…',
      body: `Dear {consumer},

Thank you for raising this matter with us (Ref: {ref}). We understand how concerning unexpected charges can be.

After a thorough review of your account, we can confirm that the charge in question relates to [describe charge/service]. This was applied in accordance with the terms and conditions agreed to at the time of sign-up.

We understand this may not be the outcome you were hoping for, and we are happy to discuss your current plan or explore alternative options that may better suit your needs.

Please don't hesitate to contact us directly if you have any further questions.

Kind regards,
{company} Billing Team`,
    },
  ],

  delivery: [
    {
      id:      'delivery_investigating',
      tone:    'Investigating',
      emoji:   '📦',
      title:   'Delivery issue — investigating',
      preview: 'We have raised an urgent investigation with our…',
      body: `Dear {consumer},

Thank you for contacting us regarding your delivery (Ref: {ref}).

We are sorry to hear your order has not arrived as expected. We have raised an urgent investigation with our logistics partner and are actively tracking the whereabouts of your parcel.

We will provide you with a full update within 48 hours. If your item cannot be located, we will arrange either a replacement dispatch or a full refund — whichever you prefer.

We apologise for the inconvenience and thank you for your patience.

Kind regards,
{company} Delivery Team`,
    },
    {
      id:      'delivery_replacement',
      tone:    'Replacement Arranged',
      emoji:   '🔄',
      title:   'Replacement / refund arranged',
      preview: 'We have arranged a replacement to be dispatched…',
      body: `Dear {consumer},

Thank you for your patience while we investigated your delivery complaint (Ref: {ref}).

After reviewing your case, we are pleased to confirm that a replacement order has been arranged and will be dispatched within 1–2 business days. You will receive a new tracking number via email shortly.

Alternatively, if you would prefer a full refund rather than a replacement, please let us know and we will process this immediately.

We apologise for the delay and the inconvenience caused.

Kind regards,
{company} Delivery Team`,
    },
    {
      id:      'delivery_wrong_item',
      tone:    'Wrong Item',
      emoji:   '↩️',
      title:   'Wrong item — return & replacement',
      preview: 'We sincerely apologise for sending the incorrect item…',
      body: `Dear {consumer},

Thank you for bringing this to our attention (Ref: {ref}). We sincerely apologise for dispatching the incorrect item — this is not the standard of service we hold ourselves to.

A prepaid return label will be emailed to you within 24 hours. Once we confirm receipt of the returned item, your correct order will be dispatched immediately at no additional cost.

If you would prefer a full refund instead, we are happy to process this as soon as the item is on its way back to us.

Kind regards,
{company} Delivery Team`,
    },
  ],

  service: [
    {
      id:      'service_escalated',
      tone:    'Escalated to Specialist',
      emoji:   '🎧',
      title:   'Escalated to specialist team',
      preview: 'Your case has been escalated to a senior specialist…',
      body: `Dear {consumer},

Thank you for reaching out to us regarding your service experience (Ref: {ref}).

We are very sorry to hear that your recent interaction did not meet the standard of service you deserve. Your case has been escalated directly to our senior customer relations team, who will personally oversee the resolution of your complaint.

A specialist will be in contact with you within 24 hours to discuss the matter in detail and agree on an appropriate resolution.

We value your loyalty and are committed to making this right.

Kind regards,
{company} Customer Relations`,
    },
    {
      id:      'service_apology',
      tone:    'Apology & Resolution',
      emoji:   '🤝',
      title:   'Apology for poor service',
      preview: 'We have reviewed the interaction and want to sincerely…',
      body: `Dear {consumer},

Thank you for taking the time to share your experience with us (Ref: {ref}).

We have reviewed the interaction in detail and want to sincerely apologise. The level of service you received fell well below the standard we expect from our team. This has been addressed internally.

As a gesture of goodwill, we would like to offer you [compensation/credit/solution]. We hope this goes some way towards restoring your confidence in us.

Your feedback is invaluable and has been shared with our training team to ensure this does not happen again.

Kind regards,
{company} Customer Relations`,
    },
    {
      id:      'service_technical',
      tone:    'Technical Resolution',
      emoji:   '🛠️',
      title:   'Technical issue — resolved',
      preview: 'Our technical team has identified and resolved the root cause…',
      body: `Dear {consumer},

Thank you for reporting this service issue to us (Ref: {ref}).

Our technical team has now identified and resolved the root cause of the problem you experienced. The fix has been applied to your account and you should no longer experience any disruption.

We understand how frustrating service interruptions can be, and we want to assure you that we have taken steps to prevent a recurrence. As a gesture of goodwill, we have [applied credit / extended your plan / waived charges] on your account.

Please don't hesitate to reach out if you experience any further issues.

Kind regards,
{company} Technical Support`,
    },
  ],

  refund: [
    {
      id:      'refund_processing',
      tone:    'Refund Processing',
      emoji:   '💰',
      title:   'Refund — being processed',
      preview: 'We have approved your refund and it is being processed…',
      body: `Dear {consumer},

Thank you for your patience regarding complaint Ref: {ref}.

We have reviewed your refund request and are pleased to confirm it has been approved. The amount will be returned to your original payment method within 3–5 business days.

Please be aware that processing times may vary slightly depending on your bank or financial institution. If you have not received the refund within 7 business days, please contact us directly and we will investigate immediately.

We apologise for the inconvenience and thank you for giving us the opportunity to resolve this.

Kind regards,
{company} Finance Team`,
    },
    {
      id:      'refund_declined',
      tone:    'Refund Declined',
      emoji:   '📋',
      title:   'Refund — outcome explanation',
      preview: 'After reviewing your case, we are unable to approve…',
      body: `Dear {consumer},

Thank you for contacting us regarding complaint Ref: {ref}. We understand how important this matter is to you and appreciate your patience while we reviewed your case.

After a thorough investigation, we are unfortunately unable to approve a refund on this occasion. Our assessment found that [brief reason]. This is in line with our returns policy, which is available at [link].

We understand this may not be the outcome you were hoping for. If you believe there are additional circumstances we have not considered, we welcome the opportunity to review further evidence. Please reply with any supporting documentation and we will re-open the case.

Kind regards,
{company} Customer Relations`,
    },
    {
      id:      'refund_goodwill',
      tone:    'Goodwill Gesture',
      emoji:   '🎁',
      title:   'Goodwill credit offered',
      preview: 'While outside our standard policy, as a gesture of goodwill…',
      body: `Dear {consumer},

Thank you for raising this matter with us (Ref: {ref}).

While your request falls outside our standard refund policy, we recognise the frustration this situation has caused and want to acknowledge your experience. As a gesture of goodwill and in recognition of your loyalty, we would like to offer you an account credit of [amount].

This credit will be applied to your account within 1–2 business days and can be used towards your next purchase or invoice.

We hope this resolution demonstrates our commitment to your satisfaction.

Kind regards,
{company} Customer Relations`,
    },
  ],

  fraud: [
    {
      id:      'fraud_urgent',
      tone:    'Urgent Investigation',
      emoji:   '🚨',
      title:   'Fraud — urgent investigation opened',
      preview: 'We are taking this report extremely seriously…',
      body: `Dear {consumer},

Thank you for bringing this to our immediate attention (Ref: {ref}).

We are taking this report extremely seriously. An urgent investigation has been opened and our fraud and security team has been notified. As a precautionary measure, we have [frozen the account / flagged the transaction / escalated to our compliance team].

We will provide you with a full update within 24–48 hours. In the meantime, we strongly recommend that you also contact your bank or financial institution if any unauthorised financial transactions have occurred.

Your security is our absolute priority.

Kind regards,
{company} Security & Fraud Team`,
    },
    {
      id:      'fraud_refund',
      tone:    'Unauthorised Charge — Refund',
      emoji:   '🛡️',
      title:   'Unauthorised charge — refund confirmed',
      preview: 'We have confirmed the charge was unauthorised and a full refund…',
      body: `Dear {consumer},

Thank you for your patience while we investigated this matter (Ref: {ref}).

After a thorough review, we have confirmed that the charge in question was applied in error and was not authorised by you. A full refund has been processed and will appear on your account within 3–5 business days.

We have also taken steps to ensure no further charges will occur and have flagged this for our internal compliance review.

We sincerely apologise for this experience and for any distress it may have caused.

Kind regards,
{company} Security & Fraud Team`,
    },
    {
      id:      'fraud_no_record',
      tone:    'No Record Found',
      emoji:   '🔎',
      title:   'No matching charge found',
      preview: 'After reviewing our records, we have found no charge matching…',
      body: `Dear {consumer},

Thank you for contacting us regarding complaint Ref: {ref}. We understand how alarming an unexpected or unrecognised charge can be.

After a thorough review of our records, we have found no charge matching the amount or description provided. It is possible this charge may have originated from a third-party provider or subscription service using a similar merchant name.

We recommend checking with your bank for the full merchant descriptor, as this can help identify the source. If you provide additional information — such as the exact transaction date and amount — we will continue our investigation on our end.

Kind regards,
{company} Security & Fraud Team`,
    },
  ],

  other: [
    {
      id:      'other_ack',
      tone:    'Acknowledgement',
      emoji:   '📝',
      title:   'Complaint received — under review',
      preview: 'We have received your complaint and are reviewing…',
      body: `Dear {consumer},

Thank you for contacting us regarding complaint Ref: {ref}.

We have received and reviewed the details of your complaint. Our customer relations team is currently investigating the matter and will be in touch with a detailed response within 3–5 business days.

We take all feedback seriously and appreciate you giving us the opportunity to address this directly. Your patience is greatly appreciated.

Kind regards,
{company} Customer Relations`,
    },
    {
      id:      'other_resolved',
      tone:    'Resolved',
      emoji:   '✅',
      title:   'Issue resolved — outcome summary',
      preview: 'We are pleased to confirm your complaint has been resolved…',
      body: `Dear {consumer},

Thank you for your patience throughout this process (Ref: {ref}).

We are pleased to confirm that your complaint has been reviewed and resolved. [Describe the outcome and any action taken].

We have used this feedback to improve our processes and ensure a better experience for all our customers going forward.

If you have any further questions or concerns, please don't hesitate to reach out to us directly.

Kind regards,
{company} Customer Relations`,
    },
    {
      id:      'other_escalated',
      tone:    'Escalated',
      emoji:   '⬆️',
      title:   'Escalated to management',
      preview: 'Your complaint has been escalated to our senior management…',
      body: `Dear {consumer},

Thank you for bringing this matter to our attention (Ref: {ref}).

Given the nature of your complaint, we have escalated this directly to our senior management team to ensure it receives the highest level of attention. A member of the leadership team will be in contact with you personally within 2 business days.

We sincerely apologise for the experience that led to this complaint and are committed to making it right.

Kind regards,
{company} Customer Relations`,
    },
  ],
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function buildTemplate(body, { consumerName, refNumber, companyName }) {
  return body
    .replace(/\{consumer\}/g, consumerName || 'Valued Customer')
    .replace(/\{ref\}/g,      refNumber    || 'N/A')
    .replace(/\{company\}/g,  companyName  || 'Our Team')
}

const TONE_STYLE = {
  'Acknowledgement':        { bg: 'var(--color-paper-2)',   border: 'var(--color-line)',           fg: 'var(--color-ink-2)' },
  'Under Investigation':    { bg: '#EEF2FF',                border: '#C7D2FE',                     fg: '#3730A3' },
  'Refund Approved':        { bg: 'var(--color-eucalyptus-3)', border: 'var(--color-eucalyptus)',  fg: 'var(--color-eucalyptus)' },
  'Refund Processing':      { bg: 'var(--color-eucalyptus-3)', border: 'var(--color-eucalyptus)',  fg: 'var(--color-eucalyptus)' },
  'Refund Declined':        { bg: 'var(--color-clay-soft)',  border: 'var(--color-clay)',          fg: 'var(--color-clay)' },
  'Charge Clarification':   { bg: '#FEF9C3',                border: '#FDE047',                     fg: '#713F12' },
  'Investigating':          { bg: '#EEF2FF',                border: '#C7D2FE',                     fg: '#3730A3' },
  'Replacement Arranged':   { bg: 'var(--color-eucalyptus-3)', border: 'var(--color-eucalyptus)',  fg: 'var(--color-eucalyptus)' },
  'Wrong Item':             { bg: '#FFF7ED',                border: '#FDBA74',                     fg: '#9A3412' },
  'Escalated to Specialist':{ bg: '#F5F3FF',                border: '#DDD6FE',                     fg: '#6D28D9' },
  'Apology & Resolution':   { bg: 'var(--color-eucalyptus-3)', border: 'var(--color-eucalyptus)',  fg: 'var(--color-eucalyptus)' },
  'Technical Resolution':   { bg: '#EEF2FF',                border: '#C7D2FE',                     fg: '#3730A3' },
  'Goodwill Gesture':       { bg: '#FFF7ED',                border: '#FDBA74',                     fg: '#9A3412' },
  'Urgent Investigation':   { bg: 'var(--color-clay-soft)',  border: 'var(--color-clay)',          fg: 'var(--color-clay)' },
  'Unauthorised Charge — Refund': { bg: 'var(--color-eucalyptus-3)', border: 'var(--color-eucalyptus)', fg: 'var(--color-eucalyptus)' },
  'No Record Found':        { bg: '#F5F3FF',                border: '#DDD6FE',                     fg: '#6D28D9' },
  'Information Needed':     { bg: '#FFF7ED',                border: '#FDBA74',                     fg: '#9A3412' },
  'Escalated':              { bg: '#F5F3FF',                border: '#DDD6FE',                     fg: '#6D28D9' },
  'Resolved':               { bg: 'var(--color-eucalyptus-3)', border: 'var(--color-eucalyptus)',  fg: 'var(--color-eucalyptus)' },
}

function toneStyle(tone) {
  return TONE_STYLE[tone] ?? { bg: 'var(--color-paper-2)', border: 'var(--color-line)', fg: 'var(--color-ink-2)' }
}

/* ── Main component ───────────────────────────────────────────────────────── */
export default function CompanyResponseForm({ complaintId, complaint, onSubmitted }) {
  const [content,       setContent]       = useState('')
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState('')
  const [panelOpen,     setPanelOpen]     = useState(false)
  const [usedTemplate,  setUsedTemplate]  = useState(null)
  const [activeTab,     setActiveTab]     = useState('category') // 'category' | 'universal'
  const textareaRef = useRef(null)

  const consumerName = complaint?.consumer_contact?.name || complaint?.consumer?.name || ''
  const refNumber    = complaint?.reference_number ?? ''
  const companyName  = complaint?.company?.name ?? ''
  const category     = complaint?.category ?? 'other'

  const categoryTemplates = CATEGORY_TEMPLATES[category] ?? CATEGORY_TEMPLATES.other
  const allTemplates = activeTab === 'universal' ? UNIVERSAL_TEMPLATES : categoryTemplates

  const applyTemplate = (tpl) => {
    const text = buildTemplate(tpl.body, { consumerName, refNumber, companyName })
    setContent(text)
    setUsedTemplate(tpl.id)
    setPanelOpen(false)
    // Focus + scroll textarea into view
    setTimeout(() => {
      textareaRef.current?.focus()
      textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 80)
  }

  const clearTemplate = () => {
    setContent('')
    setUsedTemplate(null)
    textareaRef.current?.focus()
  }

  const handleContentChange = (e) => {
    setContent(e.target.value)
    if (usedTemplate) setUsedTemplate('modified') // mark as modified
  }

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await api.post(`/complaints/${complaintId}/response`, { content })
      onSubmitted(res.data)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to submit response.')
    } finally {
      setLoading(false)
    }
  }

  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1)

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '2px solid var(--color-eucalyptus)' }}>

      {/* ── Header ── */}
      <div className="px-5 py-3.5 flex items-center justify-between gap-3"
        style={{ background: 'var(--color-eucalyptus)', color: 'var(--color-paper)' }}>
        <div className="flex items-center gap-2.5">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
          </svg>
          <div>
            <p className="text-sm font-semibold leading-tight">Respond to this complaint</p>
            <p className="text-[11px] opacity-75 leading-tight">Your response is publicly visible once submitted</p>
          </div>
        </div>

        {/* Smart Reply toggle */}
        <button
          type="button"
          onClick={() => setPanelOpen(v => !v)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition shrink-0"
          style={{
            background: panelOpen ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)',
            color: 'var(--color-paper)',
            border: '1px solid rgba(255,255,255,0.3)',
          }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          Smart Reply
          <svg className={`w-3 h-3 transition-transform ${panelOpen ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
      </div>

      {/* ── Smart Reply Panel ── */}
      {panelOpen && (
        <div className="p-5 space-y-4" style={{ background: 'var(--color-eucalyptus-3)', borderBottom: '1px solid color-mix(in srgb, var(--color-eucalyptus) 20%, transparent)' }}>

          {/* Tab switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('category')}
              className="text-xs font-semibold px-3 py-1.5 rounded-full transition"
              style={activeTab === 'category'
                ? { background: 'var(--color-eucalyptus)', color: 'var(--color-paper)' }
                : { background: 'var(--color-card)', color: 'var(--color-ink-2)', border: '1px solid var(--color-line)' }
              }
            >
              {categoryLabel} templates
            </button>
            <button
              onClick={() => setActiveTab('universal')}
              className="text-xs font-semibold px-3 py-1.5 rounded-full transition"
              style={activeTab === 'universal'
                ? { background: 'var(--color-eucalyptus)', color: 'var(--color-paper)' }
                : { background: 'var(--color-card)', color: 'var(--color-ink-2)', border: '1px solid var(--color-line)' }
              }
            >
              General
            </button>
            <span className="ml-auto text-[10px] text-[color:var(--color-muted)]">
              Click a template to insert ↓
            </span>
          </div>

          {/* Template cards grid */}
          <div className="grid gap-2.5 sm:grid-cols-3">
            {allTemplates.map(tpl => {
              const ts = toneStyle(tpl.tone)
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="text-left rounded-xl p-3.5 transition hover:scale-[1.02] active:scale-[0.99] group"
                  style={{
                    background: ts.bg,
                    border: `1px solid ${ts.border}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-base leading-none">{tpl.emoji}</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                      style={{ background: ts.border, color: ts.fg, opacity: 0.85 }}>
                      {tpl.tone}
                    </span>
                  </div>
                  <p className="text-xs font-semibold leading-snug mb-1"
                    style={{ color: 'var(--color-ink)' }}>
                    {tpl.title}
                  </p>
                  <p className="text-[11px] leading-relaxed line-clamp-2"
                    style={{ color: 'var(--color-muted)' }}>
                    {tpl.preview}
                  </p>
                  <div className="mt-2.5 flex items-center gap-1 text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition"
                    style={{ color: ts.fg }}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    Use this template
                  </div>
                </button>
              )
            })}
          </div>

          {/* Pre-fill info notice */}
          <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--color-eucalyptus)' }}>
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Templates are pre-filled with the consumer's name
            {refNumber && <>, reference <strong>{refNumber}</strong></>}
            {' '}and your company name. Review before submitting.
          </div>
        </div>
      )}

      {/* ── Response textarea ── */}
      <div className="p-5 space-y-3" style={{ background: 'var(--color-card)' }}>

        {/* Template applied indicator */}
        {usedTemplate && usedTemplate !== 'modified' && (
          <div className="flex items-center justify-between gap-3 text-xs px-3 py-2 rounded-xl"
            style={{ background: 'var(--color-eucalyptus-3)', border: '1px solid color-mix(in srgb, var(--color-eucalyptus) 20%, transparent)' }}>
            <span className="flex items-center gap-1.5" style={{ color: 'var(--color-eucalyptus)' }}>
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <strong>Template applied</strong> — review the text below and personalise as needed before submitting.
            </span>
            <button type="button" onClick={clearTemplate}
              className="text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] transition text-[10px] font-semibold shrink-0">
              Clear
            </button>
          </div>
        )}
        {usedTemplate === 'modified' && (
          <div className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl"
            style={{ background: '#FFF7ED', border: '1px solid #FDBA74', color: '#9A3412' }}>
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
            </svg>
            Template edited — your changes are saved.
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            rows={content ? Math.max(8, content.split('\n').length + 2) : 6}
            placeholder="Write your official response, or use Smart Reply above to start from a template. Be professional, empathetic, and address the specific issue raised…"
            className="input resize-none w-full text-sm leading-relaxed"
            required
            maxLength={5000}
          />

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs tabular-nums"
              style={{ color: content.length > 4500 ? 'var(--color-clay)' : 'var(--color-muted)' }}>
              {content.length.toLocaleString('en-AU')} / 5,000
            </span>
            {error && (
              <p className="text-xs flex items-center gap-1" style={{ color: 'var(--color-clay)' }}>
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {error}
              </p>
            )}
          </div>

          <button type="submit" disabled={loading || !content.trim()}
            className="btn btn-primary w-full justify-center">
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Submitting response…
              </span>
            ) : (
              <span className="flex items-center gap-2 justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
                </svg>
                Submit official response
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
