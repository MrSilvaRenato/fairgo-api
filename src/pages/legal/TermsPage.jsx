import { Link } from 'react-router-dom'
import LegalLayout from './LegalLayout'

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms & Conditions"
      subtitle="By using Aus Fair Go you agree to these terms. Please read them carefully."
      updated="18 April 2026"
    >

      <Section title="1. About Aus Fair Go">
        <p>
          Aus Fair Go ("we", "us", "our") is an Australian consumer complaint platform that enables
          consumers to submit, publish, and manage complaints against businesses, and enables
          businesses to respond to those complaints publicly. Aus Fair Go is operated as a digital
          intermediary and does not provide legal, financial, or consumer advocacy advice.
        </p>
        <p>
          By accessing or using ausfairgo.com.au ("the Platform"), you agree to be bound by these
          Terms &amp; Conditions and our <Link to="/privacy">Privacy Policy</Link>. If you do not
          agree, do not use the Platform.
        </p>
      </Section>

      <Section title="2. Eligibility">
        <ul>
          <li>You must be at least 18 years of age to create an account.</li>
          <li>You must be located in or have had a consumer experience in Australia.</li>
          <li>Each person may hold only one consumer account. Duplicate accounts may be terminated.</li>
          <li>By registering, you warrant that all information you provide is accurate and truthful.</li>
        </ul>
      </Section>

      <Section title="3. User accounts">
        <p>
          You are responsible for maintaining the security of your account credentials. Aus Fair Go
          is not liable for any loss arising from unauthorised access to your account caused by
          your failure to keep credentials secure.
        </p>
        <p>
          We reserve the right to suspend or permanently terminate any account that breaches
          these Terms, our <Link to="/community-guidelines">Community Guidelines</Link>, or
          applicable Australian law — without prior notice and without liability.
        </p>
      </Section>

      <Section title="4. Complaints — consumer obligations">
        <p>When you submit a complaint, you represent and warrant that:</p>
        <ul>
          <li>The complaint describes a genuine consumer experience you personally had with the named business.</li>
          <li>All factual claims in the complaint are true and accurate to the best of your knowledge.</li>
          <li>The complaint does not contain false, misleading, or defamatory statements.</li>
          <li>You have not been paid, incentivised, or directed by a third party (including a competitor) to submit the complaint.</li>
          <li>The complaint does not infringe any third-party intellectual property rights.</li>
          <li>You grant Aus Fair Go a non-exclusive, royalty-free, worldwide licence to display, moderate,
          edit, translate, and republish your complaint content for the purpose of operating the Platform.</li>
        </ul>
      </Section>

      <Section title="5. Content moderation">
        <p>
          Aus Fair Go uses automated AI-assisted content moderation and human review to assess complaints
          prior to publication. We reserve the right — but do not assume the obligation — to review,
          edit, hold, or remove any content at our sole discretion, for any reason, at any time.
        </p>
        <p>
          <strong>Importantly:</strong> The fact that a complaint is published on Aus Fair Go does not
          constitute Aus Fair Go's endorsement of, or agreement with, the content of that complaint.
          Aus Fair Go is a platform intermediary and not the author, publisher, or republisher of
          user-generated content within the meaning of defamation law.
        </p>
        <p>
          If you believe published content is defamatory, false, or otherwise unlawful, contact
          us at <a href="mailto:legal@ausfairgo.com.au">legal@ausfairgo.com.au</a> with the complaint ID
          and a detailed written explanation. We will respond within 5 business days.
        </p>
      </Section>

      <Section title="6. Business accounts and responses">
        <p>
          Businesses that claim their profile on Aus Fair Go may respond to consumer complaints publicly.
          By responding, the business:
        </p>
        <ul>
          <li>Warrants that its response is accurate and not misleading.</li>
          <li>Agrees not to use responses to harass, demean, or identify consumers.</li>
          <li>Agrees not to offer incentives to consumers to remove or alter their complaints.</li>
          <li>Acknowledges that consumer complaints, once published, may not be removed solely at the business's request — except where content breaches these Terms or applicable law.</li>
        </ul>
      </Section>

      <Section title="7. Aus Fair Go score and badges">
        <p>
          The Aus Fair Go Score is a calculated metric based on consumer feedback data submitted to the
          Platform. It is provided for informational purposes only. Aus Fair Go makes no representation
          that the score accurately reflects the overall quality or trustworthiness of any business.
        </p>
        <p>
          The "Aus Fair Go Verified" badge is awarded automatically when a business meets defined
          quantitative thresholds. It does not constitute a recommendation, endorsement, or
          certification by Aus Fair Go. Badges may be removed at any time if criteria are no longer met.
        </p>
      </Section>

      <Section title="8. Intellectual property">
        <p>
          All software, design, trademarks, logos, and original content on the Platform are the
          intellectual property of Aus Fair Go and may not be copied, reproduced, or distributed
          without written permission.
        </p>
        <p>
          User-generated content (complaints, responses, replies) remains the intellectual property
          of the original author. By submitting content you grant Aus Fair Go the licence described in
          clause 4 above.
        </p>
      </Section>

      <Section title="9. Limitation of liability">
        <p>
          To the maximum extent permitted by Australian law, including the{' '}
          <em>Australian Consumer Law</em> (Schedule 2 of the{' '}
          <em>Competition and Consumer Act 2010</em> (Cth)):
        </p>
        <ul>
          <li>Aus Fair Go is not liable for any direct, indirect, incidental, special, or consequential
          loss arising from your use of the Platform.</li>
          <li>Aus Fair Go is not liable for the accuracy, completeness, or lawfulness of any
          user-generated content published on the Platform.</li>
          <li>Aus Fair Go is not liable for any failure or delay in moderating, publishing, or removing
          content.</li>
          <li>Our total liability to you in any circumstance is limited to AUD $100.</li>
        </ul>
        <p>
          Nothing in these Terms excludes any guarantee, right, or remedy that cannot be excluded
          under the <em>Australian Consumer Law</em>.
        </p>
      </Section>

      <Section title="10. Defamation and take-down requests">
        <p>
          Aus Fair Go takes defamation concerns seriously. If you are a business or individual who
          believes a complaint published on this Platform is defamatory under Australian law
          (including the <em>Defamation Act 2005</em> as adopted in each state and territory),
          you must submit a written take-down request to{' '}
          <a href="mailto:legal@ausfairgo.com.au">legal@ausfairgo.com.au</a> including:
        </p>
        <ul>
          <li>Your full name and contact details</li>
          <li>The URL or complaint ID you are disputing</li>
          <li>A detailed explanation of why the content is allegedly defamatory</li>
          <li>A statement that the information in your request is accurate and made in good faith</li>
        </ul>
        <p>
          We will acknowledge your request within 2 business days and respond substantively within
          10 business days. We may offer the consumer an opportunity to respond or amend their
          complaint before making a final determination.
        </p>
      </Section>

      <Section title="11. Privacy">
        <p>
          Our collection, use, and disclosure of personal information is governed by our{' '}
          <Link to="/privacy">Privacy Policy</Link>, which complies with the{' '}
          <em>Privacy Act 1988</em> (Cth) and the Australian Privacy Principles (APPs).
        </p>
      </Section>

      <Section title="12. Governing law">
        <p>
          These Terms are governed by the laws of New South Wales, Australia. Any dispute arising
          from your use of the Platform will be subject to the exclusive jurisdiction of the
          courts of New South Wales, without prejudice to your rights under the Australian
          Consumer Law to seek redress from the ACCC or a relevant state consumer protection agency.
        </p>
      </Section>

      <Section title="13. Changes to these Terms">
        <p>
          We may update these Terms at any time. Continued use of the Platform after changes
          are published constitutes acceptance of the revised Terms. Material changes will be
          notified via a banner on the Platform for a minimum of 14 days.
        </p>
      </Section>

      <Section title="14. Contact">
        <p>
          For legal enquiries: <a href="mailto:legal@ausfairgo.com.au">legal@ausfairgo.com.au</a><br />
          For moderation disputes: <a href="mailto:moderation@ausfairgo.com.au">moderation@ausfairgo.com.au</a><br />
          For general enquiries: <a href="mailto:hello@ausfairgo.com.au">hello@ausfairgo.com.au</a>
        </p>
      </Section>

      <div className="mt-8 pt-6 border-t text-sm text-[color:var(--color-muted)] flex flex-wrap gap-4">
        <Link to="/community-guidelines" className="hover:text-[color:var(--color-ink)] transition">Community Guidelines</Link>
        <Link to="/privacy" className="hover:text-[color:var(--color-ink)] transition">Privacy Policy</Link>
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
