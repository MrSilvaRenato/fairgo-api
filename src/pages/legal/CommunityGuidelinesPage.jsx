import { Link } from 'react-router-dom'
import LegalLayout from './LegalLayout'

export default function CommunityGuidelinesPage() {
  return (
    <LegalLayout
      title="Community Guidelines"
      subtitle="Fair, factual and respectful — the foundation of a platform that businesses and consumers can both trust."
      updated="18 April 2026"
    >

      <Section title="Why guidelines matter">
        <p>
          Aus Fair Go exists to give Australian consumers a voice and to give businesses the opportunity
          to make things right. That only works when the content on this platform is honest, factual,
          and respectful. These guidelines apply to everyone who submits a complaint, posts a reply,
          or otherwise contributes content to Aus Fair Go.
        </p>
        <p>
          Breaching these guidelines may result in your content being edited, removed, or your account
          being suspended — without notice and at Aus Fair Go's sole discretion.
        </p>
      </Section>

      <Section title="What makes a good complaint">
        <p>A complaint on Aus Fair Go should:</p>
        <ul>
          <li><strong>Describe a real consumer experience</strong> — something that actually happened to you with a specific business.</li>
          <li><strong>Be specific</strong> — include dates, amounts, product names, or reference numbers where relevant.</li>
          <li><strong>State what you want</strong> — a refund, an apology, a replacement, a fix. Tell the company what resolution you're seeking.</li>
          <li><strong>Be your own experience</strong> — you must be the consumer who had the experience, or have explicit authorisation to act on their behalf.</li>
        </ul>
      </Section>

      <Section title="What is allowed">
        <p>We actively protect your right to express genuine consumer frustration. The following is <strong>always permitted</strong>:</p>
        <ul>
          <li>Strong but factual descriptions of poor service ("absolutely terrible", "completely unacceptable", "a total disgrace")</li>
          <li>Emotional language expressing frustration as a consumer</li>
          <li>Saying you feel deceived or misled, when describing your specific experience</li>
          <li>Demanding a refund, replacement, formal apology, or accountability</li>
          <li>Mentioning personal context relevant to the complaint (pregnancy, disability, elderly, financial hardship)</li>
          <li>Using words like "scam" or "fraud" when describing your specific experience and the reasons why you feel that way</li>
          <li>Negative reviews of a company's products, services, staff behaviour, or policies</li>
        </ul>
      </Section>

      <Section title="What is not allowed">
        <Subsection title="1. Profanity and offensive language">
          <p>
            Swear words and offensive language will be automatically censored or may result in your
            complaint being held for review. Severe cases may be rejected entirely. Use strong but
            clean language — it is more persuasive anyway.
          </p>
        </Subsection>

        <Subsection title="2. Personal information">
          <p>
            Do not include other people's personal information in your complaint — including phone
            numbers, home addresses, government ID numbers (TFN, Medicare), bank account numbers,
            or email addresses. This applies to company staff as well as other individuals.
            Your own contact details are also unnecessary — use Aus Fair Go's messaging system instead.
          </p>
        </Subsection>

        <Subsection title="3. Threats">
          <p>
            Threats of physical harm, property damage, or illegal action against a company, its
            staff, or any individual will result in immediate rejection and may be reported to
            Australian law enforcement.
          </p>
        </Subsection>

        <Subsection title="4. Unverifiable defamatory claims">
          <p>
            Accusing a business of specific criminal conduct (money laundering, bribery, operating
            as a criminal enterprise) without any factual basis goes beyond a consumer complaint.
            Such content will be held for human review. If you have genuine evidence of criminal
            conduct, report it to the <a href="https://www.accc.gov.au" target="_blank" rel="noopener noreferrer">ACCC</a> or
            Australian Federal Police.
          </p>
        </Subsection>

        <Subsection title="5. Spam and fake complaints">
          <p>
            Submitting the same complaint multiple times, gibberish, or complaints with no real
            substance will be rejected. Complaints submitted on behalf of a competitor business
            (competitor attacks) will be permanently removed and the account banned.
          </p>
        </Subsection>

        <Subsection title="6. Discrimination and hate speech">
          <p>
            Content that discriminates against or vilifies individuals or groups based on race,
            religion, gender, sexual orientation, disability, or national origin is prohibited and
            will be removed immediately.
          </p>
        </Subsection>
      </Section>

      <Section title="How we moderate content">
        <p>
          Every complaint submitted to Aus Fair Go is reviewed by our AI content moderation system
          before being published. The system may:
        </p>
        <ul>
          <li><strong>Approve</strong> — publish immediately with no changes</li>
          <li><strong>Edit</strong> — censor profanity or remove personal information, then publish with an "Edited by Aus Fair Go" notice</li>
          <li><strong>Flag</strong> — hold from public view for human review by the Aus Fair Go team</li>
          <li><strong>Reject</strong> — remove entirely (spam, threats, severe violations)</li>
        </ul>
        <p>
          If your complaint is held for review, you will see a notification. Most reviews are
          completed within 24 hours. You will not be notified of automatic edits, but an
          "Edited by Aus Fair Go" notice will appear on your complaint.
        </p>
      </Section>

      <Section title="Company responses">
        <p>Companies responding to complaints must also follow these guidelines. Specifically:</p>
        <ul>
          <li>Responses must address the complaint honestly — do not deny an issue you know occurred.</li>
          <li>Do not use responses to attack or demean the consumer.</li>
          <li>Do not request that the consumer remove or change their complaint as a condition of resolution.</li>
          <li>Do not post templated non-responses that ignore the consumer's actual issue.</li>
        </ul>
        <p>
          Company responses that breach these guidelines may be removed and the company's score
          and verification status may be affected.
        </p>
      </Section>

      <Section title="Reporting a breach">
        <p>
          If you believe a complaint, response, or reply on Aus Fair Go breaches these guidelines,
          please contact us at <a href="mailto:moderation@ausfairgo.com.au">moderation@ausfairgo.com.au</a>.
          Include the complaint ID and a brief explanation. We aim to respond within 2 business days.
        </p>
      </Section>

      <div className="mt-8 pt-6 border-t text-sm text-[color:var(--color-muted)] flex flex-wrap gap-4">
        <Link to="/terms" className="hover:text-[color:var(--color-ink)] transition">Terms &amp; Conditions</Link>
        <Link to="/privacy" className="hover:text-[color:var(--color-ink)] transition">Privacy Policy</Link>
      </div>

    </LegalLayout>
  )
}

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg font-semibold text-[color:var(--color-ink)] pt-2">{title}</h2>
      <div className="space-y-3 text-sm text-[color:var(--color-ink-2)] leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-[color:var(--color-eucalyptus)] [&_a]:underline [&_a]:underline-offset-2">
        {children}
      </div>
    </section>
  )
}

function Subsection({ title, children }) {
  return (
    <div className="space-y-1.5">
      <h3 className="font-semibold text-[color:var(--color-ink)] text-sm">{title}</h3>
      <div className="space-y-2 text-sm text-[color:var(--color-ink-2)] leading-relaxed [&_a]:text-[color:var(--color-eucalyptus)] [&_a]:underline [&_a]:underline-offset-2">
        {children}
      </div>
    </div>
  )
}
