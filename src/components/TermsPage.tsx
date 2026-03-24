import React from 'react';
import { LegalPageLayout } from './LegalPageLayout';

interface TermsPageProps {
  onBack: () => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onBack }) => {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated="24 March 2026" onBack={onBack}>
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Service Scope</h2>
        <p>Crystalline Max provides mobile detailing, residential cleaning, and commercial cleaning services. Service scope, pricing, add-ons, and scheduling depend on booking details accepted through the platform.</p>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Bookings And Confirmation</h2>
        <p>Submitting a booking request does not by itself guarantee acceptance. A booking may remain pending until reviewed, scheduled, and confirmed. Operational details shown in the portal are part of the service workflow once the booking is accepted.</p>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Pricing And Payment</h2>
        <p>Quoted pricing is based on selected service type, add-ons, and booking information supplied through the platform. Payment handling is expected to include online card payments and Apple Pay through Stripe Checkout, alongside approved offline payment collection where marked by admin.</p>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Cancellations And Refunds</h2>
        <p>Customers may cancel subject to the operational and refund terms ultimately adopted by the business. The current platform supports cancellation state handling, but final commercial cancellation windows and refund rules must be confirmed before launch.</p>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Photo Evidence</h2>
        <p>Service workflows may require before and after photos for operational proof, quality control, and dispute handling. By using the service platform, customers acknowledge that job evidence may be collected and stored as part of the booked service record.</p>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Liability</h2>
        <p>Crystalline Max aims to perform services with reasonable care and skill. Liability terms, exclusions, and claim procedures should be finalized during legal review and aligned with the final business operating model.</p>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Governing Law</h2>
        <p>These draft terms are intended to align with the laws of England and Wales unless revised during final legal review.</p>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Contact</h2>
        <p>Terms and service questions should be directed to <span className="font-bold text-white">info@crystallinemax.co.uk</span> pending confirmation of the final business support channel.</p>
      </section>
    </LegalPageLayout>
  );
};
