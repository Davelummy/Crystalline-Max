import React from 'react';
import { LegalPageLayout } from './LegalPageLayout';
import { useGeneralSettings } from '@/lib/generalSettings';

interface TermsPageProps {
  onBack: () => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onBack }) => {
  const { settings } = useGeneralSettings();

  return (
    <LegalPageLayout title="Terms of Service" lastUpdated="24 March 2026" onBack={onBack}>
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Service Scope</h2>
        <p>
          {settings.businessName} provides mobile vehicle detailing, residential cleaning, and commercial cleaning services. Service scope, add-ons, pricing, and scheduling depend on the booking details submitted through the platform and any later confirmation or amendment accepted by {settings.businessName}.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Bookings And Confirmation</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Submitting a booking request does not by itself guarantee acceptance.</li>
          <li>Bookings may remain pending until reviewed by admin and either confirmed, reassigned, amended, or cancelled.</li>
          <li>Customers are responsible for ensuring booking details, property or vehicle access conditions, and service-location information are accurate.</li>
          <li>{settings.businessName} may refuse, reschedule, or cancel a booking where location access, safety, staffing, time availability, or job scope make the booking impractical or unsafe.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Pricing And Payment</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Quoted pricing is based on selected service type, add-ons, and booking information submitted through the platform.</li>
          <li>Online card payments are processed through Stripe Checkout. On supported browsers and verified production domains, Apple Pay may be offered through Stripe.</li>
          <li>Some bookings may be marked for approved offline payment collection. Where that happens, the booking record may show payment as not required online.</li>
          <li>{settings.businessName} may require payment before service, after service, or according to a commercial arrangement agreed for the booking.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Cancellations And Refunds</h2>
        <p>
          Customers may request cancellation through the platform where permitted by booking state. {settings.businessName} may also cancel bookings for operational, safety, staffing, or access reasons. The cancellation terms are:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Cancellation requested with reasonable notice before a confirmed appointment: no cancellation fee unless special materials or dedicated staffing were reserved.</li>
          <li>Late cancellation, no access on arrival, or materially inaccurate job description: {settings.businessName} may retain a reasonable call-out or wasted-journey charge.</li>
          <li>Refunds for online payments will be assessed against the booking state, work completed, and any evidence retained in the booking record.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Photo Evidence</h2>
        <p>
          Service workflows may require before and after photographs for operational proof, quality control, training, fraud prevention, and dispute handling. By booking through the platform, the customer acknowledges that relevant job evidence may be collected and stored as part of the service record. {settings.businessName} does not intend to use identifiable customer imagery for marketing without a separate permission basis.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Access And Customer Responsibilities</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>The customer must provide safe and lawful access to the booked location, vehicle, or premises.</li>
          <li>Where utilities, keys, parking, or site permissions are required, the customer is responsible for making them available.</li>
          <li>Customers must disclose material conditions that could affect service delivery, including hazardous substances, aggressive animals, restricted access, or unsafe working conditions.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Liability</h2>
        <p>
          {settings.businessName} aims to perform services with reasonable care and skill. To the extent permitted by law, {settings.businessName} is not liable for indirect or consequential loss, loss caused by inaccurate booking information, pre-existing defects, inaccessible areas, unsafe site conditions, or delays outside its reasonable control. Nothing in these terms excludes liability that cannot lawfully be excluded under the laws of England and Wales.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Complaints And Claims</h2>
        <p>
          Complaints should be raised as soon as reasonably possible after service delivery so {settings.businessName} can investigate against booking records, task history, check-in data, and any before/after photographic evidence retained in the platform.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Governing Law</h2>
        <p>
          These terms are governed by the laws of England and Wales. Any dispute arising in connection with the services or the platform will be governed by those laws unless mandatory consumer law requires otherwise.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-teal">Contact</h2>
        <p>
          Terms, booking, and service questions should be directed to <span className="font-bold text-white">{settings.supportEmail}</span>.
        </p>
      </section>
    </LegalPageLayout>
  );
};
