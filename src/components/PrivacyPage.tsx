import React from 'react';
import { LegalPageLayout } from './LegalPageLayout';

interface PrivacyPageProps {
  onBack: () => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBack }) => {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="24 March 2026" onBack={onBack}>
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Who This Covers</h2>
        <p>
          This privacy notice explains how Crystalline Max uses personal data collected through its website and service platform.
          It applies to customer accounts, booking requests, staff operational records, before and after job media, and contact submissions.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Data We Collect</h2>
        <p>Depending on the service flow, the platform currently stores name, email address, phone number, service address, postcode, verified location coordinates, booking details, before and after photos, and operational check-in records for staff job attendance.</p>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Why We Use It</h2>
        <p>We use this information to verify service locations, manage bookings, assign staff, provide job progress updates, retain photographic job evidence, operate support workflows, and maintain platform security and fraud prevention controls.</p>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Processors And Systems</h2>
        <p>The current platform uses Firebase and related Google Cloud services for authentication, database, and storage infrastructure. Planned payment processing is through Stripe. These providers act as processors or sub-processors where relevant to service delivery.</p>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Retention</h2>
        <p>Operational booking records, job photos, and related account data are retained for service administration, dispute handling, repeat service history, and internal operations. Retention windows should be finalized in the production legal review before launch.</p>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Your UK GDPR Rights</h2>
        <p>Where UK GDPR applies, you may request access, correction, deletion, restriction, objection, or portability in relation to your personal data, subject to lawful operational and contractual limits.</p>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Cookies And Browser Storage</h2>
        <p>The application uses browser storage and essential technical mechanisms required for sign-in continuity, portal state, and service operation. Any non-essential analytics or marketing cookie behavior should be introduced only with an explicit consent layer.</p>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Contact</h2>
        <p>Privacy queries should be directed to <span className="font-bold text-white">privacy@crystallinemax.co.uk</span>. This contact route is included as draft operational policy content pending final business confirmation.</p>
      </section>
    </LegalPageLayout>
  );
};
