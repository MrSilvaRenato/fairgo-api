import { Link } from 'react-router-dom'
import LegalLayout from './LegalLayout'

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="How Aus Fair Go collects, uses, and protects your personal information — in compliance with the Australian Privacy Act 1988."
      updated="18 April 2026"
    >

      <Section title="1. Who we are">
        <p>
          Aus Fair Go ("we", "us", "our") operates the consumer complaint platform at ausfairgo.com.au.
          This Privacy Policy explains how we handle personal information in accordance with the{' '}
          <em>Privacy Act 1988</em> (Cth) and the 13 Australian Privacy Principles (APPs).
        </p>
        <p>
          By using Aus Fair Go, you consent to the collection and use of your information as described
          in this policy. If you do not agree, please do not use the Platform.
        </p>
      </Section>

      <Section title="2. What personal information we collect">
        <Subsection title="Account information">
          <p>When you register, we collect: full name, email address, password (hashed), and
          account role (consumer or business).</p>
        </Subsection>
        <Subsection title="Phone number (optional)">
          <p>If you choose to verify your phone number for the "Verified Consumer" badge, we
          collect your mobile number. This is used solely for verification and is never shared
          with businesses or third parties.</p>
        </Subsection>
        <Subsection title="Complaint content">
          <p>Complaints, responses, and replies you submit are collected and, if published,
          displayed publicly. This includes the text of your complaint, category, timestamps,
          and your display name. Your email address is never displayed publicly.</p>
        </Subsection>
        <Subsection title="Business information">
          <p>If you register a business, we collect your business name, ABN, industry, website,
          and contact email. ABN lookups are conducted via the Australian Business Register (ABR).</p>
        </Subsection>
        <Subsection title="Technical information">
          <p>We automatically collect IP address, browser type, device type, pages visited, and
          timestamps for security monitoring and analytics. We use this information in aggregate
          and do not sell or share it with advertisers.</p>
        </Subsection>
        <Subsection title="Payment information">
          <p>If you subscribe to a paid business plan, payment is processed by Stripe. Aus Fair Go
          does not store your card details. We receive only a tokenised reference and subscription
          status from Stripe. Stripe's privacy policy is available at stripe.com/privacy.</p>
        </Subsection>
      </Section>

      <Section title="3. How we use your information">
        <p>We use your personal information to:</p>
        <ul>
          <li>Create and manage your account</li>
          <li>Publish, moderate, and manage complaints and responses</li>
          <li>Send transactional notifications (complaint filed, company responded, resolution requested)</li>
          <li>Verify phone numbers for the Verified Consumer badge</li>
          <li>Process payments and manage subscriptions</li>
          <li>Detect and prevent fraud, spam, and policy violations</li>
          <li>Calculate Aus Fair Go Scores and reputation signals</li>
          <li>Comply with Australian law, including responding to lawful requests from regulators</li>
          <li>Improve the Platform through anonymised analytics</li>
        </ul>
        <p>
          We will not use your personal information for direct marketing without your explicit
          consent, as required under the <em>Spam Act 2003</em> (Cth).
        </p>
      </Section>

      <Section title="4. Disclosure of personal information">
        <p>We may disclose your personal information to:</p>
        <ul>
          <li><strong>Businesses you complain about</strong> — only your display name and complaint content. Your email, phone, and account details are never shared with businesses.</li>
          <li><strong>Service providers</strong> — third-party services that help us operate the Platform (cloud hosting, email delivery, payment processing, AI moderation). These providers are contractually bound to process your data only as instructed and to maintain appropriate security.</li>
          <li><strong>Regulators and law enforcement</strong> — where required by law, a court order, or a lawful request from a regulatory body such as the ACCC, OAIC, or Australian Federal Police.</li>
          <li><strong>Successors</strong> — in the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity, subject to the same privacy protections.</li>
        </ul>
        <p>We do not sell personal information. Ever.</p>
      </Section>

      <Section title="5. Overseas disclosure">
        <p>
          Some of our service providers (including cloud infrastructure and AI services) may process
          data outside Australia. Where this occurs, we take reasonable steps to ensure those
          providers are bound by privacy obligations comparable to the APPs, in accordance with
          APP 8.
        </p>
        <p>
          Key third-party processors and their locations include: Amazon Web Services (USA/Australia),
          Anthropic (USA — AI content moderation), Stripe (USA — payment processing).
        </p>
      </Section>

      <Section title="6. AI-assisted content moderation">
        <p>
          Complaints submitted to Aus Fair Go are processed by an AI content moderation system powered
          by Anthropic's Claude. Your complaint text (title, description, expected resolution) is
          transmitted to Anthropic's API for analysis. Anthropic processes this data in accordance
          with their privacy policy. No personally identifying account information (name, email,
          phone) is transmitted to Anthropic — only the content of the complaint itself.
        </p>
        <p>
          The AI moderation result (approved, edited, flagged, or rejected) is stored alongside
          your complaint record and is visible to Aus Fair Go administrators only.
        </p>
      </Section>

      <Section title="7. Public content and your name">
        <p>
          Complaints marked as "public" are visible to anyone on the internet, including search
          engines. Your <strong>display name</strong> is shown alongside your complaint.
          Your email address, phone number, and other account details are never displayed publicly.
        </p>
        <p>
          You may submit a complaint as "private", in which case it is visible only to you and
          the company you complained about. Private complaints still count towards a company's
          score but are not indexed by search engines.
        </p>
        <p>
          Once a complaint is published, removal requests from the submitter are considered on a
          case-by-case basis and are not automatically granted. See our{' '}
          <Link to="/community-guidelines">Community Guidelines</Link> for more information.
        </p>
      </Section>

      <Section title="8. Security">
        <p>
          We implement industry-standard security measures including:
        </p>
        <ul>
          <li>HTTPS encryption for all data in transit</li>
          <li>Bcrypt password hashing — passwords are never stored in plain text</li>
          <li>API authentication via Laravel Sanctum tokens</li>
          <li>Access controls limiting employee access to personal data on a need-to-know basis</li>
          <li>Regular security reviews</li>
        </ul>
        <p>
          No security system is impenetrable. In the event of a data breach that is likely to
          result in serious harm, we will notify affected users and the Office of the Australian
          Information Commissioner (OAIC) as required under the{' '}
          <em>Notifiable Data Breaches</em> scheme (Part IIIC of the <em>Privacy Act 1988</em>).
        </p>
      </Section>

      <Section title="9. Data retention">
        <p>
          We retain your personal information for as long as your account is active or as required
          to provide the Platform. Specifically:
        </p>
        <ul>
          <li><strong>Account data</strong> — retained until you request deletion or your account is terminated.</li>
          <li><strong>Published complaints</strong> — retained indefinitely as part of the public record, unless removed under these policies.</li>
          <li><strong>Technical logs</strong> — retained for up to 90 days for security purposes.</li>
          <li><strong>Payment records</strong> — retained for 7 years as required under Australian tax law.</li>
        </ul>
      </Section>

      <Section title="10. Your rights under the Australian Privacy Principles">
        <p>Under the <em>Privacy Act 1988</em> (Cth), you have the right to:</p>
        <ul>
          <li><strong>Access</strong> — request a copy of the personal information we hold about you (APP 12)</li>
          <li><strong>Correction</strong> — request correction of inaccurate personal information (APP 13)</li>
          <li><strong>Deletion</strong> — request deletion of your account and associated personal data (subject to legal retention obligations)</li>
          <li><strong>Complaint</strong> — lodge a complaint about our privacy practices</li>
        </ul>
        <p>
          To exercise any of these rights, email{' '}
          <a href="mailto:privacy@ausfairgo.com.au">privacy@ausfairgo.com.au</a>. We will respond
          within 30 days. If you are unsatisfied with our response, you may lodge a complaint
          with the Office of the Australian Information Commissioner (OAIC) at{' '}
          <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer">oaic.gov.au</a>.
        </p>
      </Section>

      <Section title="11. Cookies">
        <p>
          Aus Fair Go uses only functional cookies necessary for authentication (session tokens).
          We do not use advertising cookies, tracking pixels, or third-party analytics cookies.
          You may disable cookies in your browser settings, but this will prevent you from
          logging in to the Platform.
        </p>
      </Section>

      <Section title="12. Children">
        <p>
          The Platform is not directed at children under 18. We do not knowingly collect personal
          information from children. If you believe a child has created an account, contact us at{' '}
          <a href="mailto:privacy@ausfairgo.com.au">privacy@ausfairgo.com.au</a> and we will promptly
          delete the account.
        </p>
      </Section>

      <Section title="13. Changes to this policy">
        <p>
          We may update this Privacy Policy to reflect changes in our practices or in applicable
          law. Material changes will be communicated via a notice on the Platform at least 14 days
          before taking effect. Your continued use of the Platform after the effective date
          constitutes acceptance of the revised policy.
        </p>
      </Section>

      <Section title="14. Contact us">
        <p>
          Privacy Officer, Aus Fair Go<br />
          <a href="mailto:privacy@ausfairgo.com.au">privacy@ausfairgo.com.au</a>
        </p>
        <p>
          For urgent data breach reports or legal matters:{' '}
          <a href="mailto:legal@ausfairgo.com.au">legal@ausfairgo.com.au</a>
        </p>
      </Section>

      <div className="mt-8 pt-6 border-t text-sm text-[color:var(--color-muted)] flex flex-wrap gap-4">
        <Link to="/terms" className="hover:text-[color:var(--color-ink)] transition">Terms &amp; Conditions</Link>
        <Link to="/community-guidelines" className="hover:text-[color:var(--color-ink)] transition">Community Guidelines</Link>
      </div>

    </LegalLayout>
  )
}

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg font-semibold text-[color:var(--color-ink)] pt-2">{title}</h2>
      <div className="space-y-3 text-sm text-[color:var(--color-ink-2)] leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-[color:var(--color-eucalyptus)] [&_a]:underline [&_a]:underline-offset-2 [&_em]:italic">
        {children}
      </div>
    </section>
  )
}

function Subsection({ title, children }) {
  return (
    <div className="space-y-1">
      <h3 className="font-semibold text-[color:var(--color-ink)] text-sm">{title}</h3>
      <div className="text-sm text-[color:var(--color-ink-2)] leading-relaxed">{children}</div>
    </div>
  )
}
