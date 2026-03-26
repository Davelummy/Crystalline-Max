import React from 'react';
import { LegalPageLayout } from './LegalPageLayout';
import { useGeneralSettings } from '@/lib/generalSettings';

interface PrivacyPageProps {
  onBack: () => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBack }) => {
  const { settings } = useGeneralSettings();

  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="24 March 2026" onBack={onBack}>
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Who This Policy Covers</h2>
        <p>
          This privacy notice explains how {settings.businessName} uses personal data collected through its website, booking platform, customer portal, staff portal, and admin operations tools. It applies to customer enquiries, account records, booking requests, verified service-location data, before and after job media, staff operational attendance records, and payment-related events handled through the platform.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Data We Collect</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Identity and contact data such as name, email address, phone number, and account profile details.</li>
          <li>Booking data such as selected service, add-ons, quoted total, requested date and time, booking status, payment status, and booking history.</li>
          <li>Location data such as service address, postcode, reverse-geocoded address labels, and verified map coordinates selected during booking.</li>
          <li>Service evidence such as before and after job photographs uploaded by assigned staff.</li>
          <li>Operational records such as staff assignment, task progress, check-in/check-out events, and site-distance validation results.</li>
          <li>Technical data such as authentication identifiers, browser/session state used for secure sign-in continuity, and diagnostic logs needed to operate the platform.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">How And Why We Use Personal Data</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>To create and manage customer accounts and booking records.</li>
          <li>To verify service locations and reduce false or incomplete address submissions.</li>
          <li>To allocate jobs to staff, manage attendance, and monitor live job execution.</li>
          <li>To provide progress visibility, before/after evidence, and job-completion updates to customers and admin users.</li>
          <li>To process or reconcile payment events, including Stripe-hosted payment confirmation and approved offline payment handling.</li>
          <li>To detect misuse, protect the platform, and preserve records for complaints, disputes, fraud prevention, and operational audit purposes.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Our Lawful Bases</h2>
        <p>
          Depending on the interaction, {settings.businessName} relies on one or more of the following lawful bases under UK GDPR:
          contract performance for booked services, legitimate interests in running and securing the business, legal obligations where records must be retained, and consent where a particular communication or optional processing activity requires it.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Processors And Service Providers</h2>
        <p>
          The platform currently uses Firebase and related Google Cloud infrastructure for authentication, database, serverless functions, and storage. Payment processing is handled through Stripe. Email notifications are sent through Resend when configured. These providers act as processors or sub-processors where they process data on behalf of {settings.businessName} for service delivery, infrastructure, communications, or payment handling.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">International Transfers</h2>
        <p>
          Some service providers may process data outside the United Kingdom. Where that happens, {settings.businessName} expects processing to take place under contractual or technical safeguards intended to meet UK GDPR standards for international data transfers.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Retention</h2>
        <p>
          Booking records, service photos, account records, check-in logs, and related operational data are retained for as long as reasonably necessary to deliver services, maintain customer history, handle complaints or disputes, meet tax/accounting needs, and defend legal claims. The retention baseline is:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Active account and booking records: retained while the customer relationship remains live and for a reasonable audit period afterwards.</li>
          <li>Before/after job media and operational records: retained for service evidence and complaint handling for up to 24 months unless a longer period is needed for a dispute.</li>
          <li>Payment-related confirmation records: retained in line with accounting and tax obligations.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Your Rights Under UK GDPR</h2>
        <p>
          Subject to applicable law, you may request access to your personal data, correction of inaccurate data, deletion, restriction, objection, and portability. You may also complain to the UK Information Commissioner&apos;s Office if you believe your data has been handled unlawfully. {settings.businessName} may ask for identity verification before acting on a request.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Cookies And Browser Storage</h2>
        <p>
          The application uses essential browser storage and technical cookies required for authentication continuity, session persistence, payment return flows, and secure portal operation. Non-essential analytics or marketing cookies should not be introduced without an appropriate consent mechanism.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Security</h2>
        <p>
          {settings.businessName} uses access controls, role-based portal separation, managed cloud infrastructure, and verification checks such as location validation and authenticated media access. No internet service can be guaranteed completely secure, so users should also keep their own credentials protected.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Contact And Complaints</h2>
        <p>
          Privacy requests and complaints should be sent to <span className="font-bold text-white">{settings.supportEmail}</span>. If you are not satisfied with the response, you may complain to the UK Information Commissioner&apos;s Office.
        </p>
      </section>
    </LegalPageLayout>
  );
};
