import React from 'react';
import { Building2, LogIn, MessageSquareText, Send } from 'lucide-react';
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/firebase';
import { SERVICES } from '@/constants';
import { getAuthErrorMessage, getClientStayLoggedInPreference, isCompanyEmail, signInWithGoogle } from '@/lib/auth';
import { getServiceById } from '@/lib/bookings';

interface QuoteRequestFlowProps {
  initialServiceId?: string;
  source: 'public' | 'customer_portal';
}

const complexServices = SERVICES.filter((service) => service.requiresQuote);

export const QuoteRequestFlow: React.FC<QuoteRequestFlowProps> = ({ initialServiceId, source }) => {
  const [user, setUser] = React.useState(auth.currentUser);
  const [authLoading, setAuthLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [stayLoggedIn, setStayLoggedIn] = React.useState(getClientStayLoggedInPreference());
  const [form, setForm] = React.useState({
    serviceId: getServiceById(initialServiceId || '')?.requiresQuote ? initialServiceId || 'office' : 'office',
    customerName: '',
    customerEmail: '',
    phoneNumber: '',
    companyName: '',
    address: '',
    city: '',
    postcode: '',
    frequency: 'one_off',
    preferredSchedule: '',
    budgetRange: '',
    preferredContact: 'email',
    scopeSummary: '',
    scopeDetails: '',
  });

  React.useEffect(() => {
    return auth.onAuthStateChanged((nextUser) => {
      setUser(nextUser);
      setForm((prev) => ({
        ...prev,
        customerName: prev.customerName || nextUser?.displayName || '',
        customerEmail: prev.customerEmail || nextUser?.email || '',
      }));
    });
  }, []);

  React.useEffect(() => {
    const resolved = getServiceById(initialServiceId || '');
    if (resolved?.requiresQuote) {
      setForm((prev) => ({ ...prev, serviceId: resolved.id }));
    }
  }, [initialServiceId]);

  const customerSession = Boolean(
    user &&
    !isCompanyEmail(user.email || ''),
  );

  const handleCustomerGoogleSignIn = async () => {
    setAuthLoading(true);
    setError(null);

    try {
      if (user && !customerSession) {
        await signOut(auth);
      }
      await signInWithGoogle('customer', { stayLoggedIn });
    } catch (authError) {
      console.error('Quote login failed:', authError);
      setError(getAuthErrorMessage(authError));
    } finally {
      setAuthLoading(false);
    }
  };

  const submitQuoteRequest = async () => {
    if (!customerSession || !user) {
      setError('Sign in with a customer Google account to submit a quote request.');
      return;
    }

    const service = getServiceById(form.serviceId);
    if (!service || !service.requiresQuote) {
      setError('Select a valid complex service for quotation.');
      return;
    }

    const requiredEntries: Array<[string, string]> = [
      ['customer name', form.customerName.trim()],
      ['customer email', form.customerEmail.trim()],
      ['phone number', form.phoneNumber.trim()],
      ['address', form.address.trim()],
      ['city', form.city.trim()],
      ['postcode', form.postcode.trim()],
      ['scope summary', form.scopeSummary.trim()],
      ['scope details', form.scopeDetails.trim()],
    ];

    const missingField = requiredEntries.find(([, value]) => !value);
    if (missingField) {
      setError(`Enter ${missingField[0]} before submitting.`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: 'client',
          bookingCount: 0,
          onboarded: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      await addDoc(collection(db, 'quoteRequests'), {
        userId: user.uid,
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim().toLowerCase(),
        phoneNumber: form.phoneNumber.trim(),
        companyName: form.companyName.trim() || null,
        serviceId: service.id,
        serviceLabel: service.label,
        address: form.address.trim(),
        city: form.city.trim(),
        postcode: form.postcode.trim(),
        frequency: form.frequency,
        preferredSchedule: form.preferredSchedule.trim(),
        budgetRange: form.budgetRange.trim(),
        preferredContact: form.preferredContact,
        scopeSummary: form.scopeSummary.trim(),
        scopeDetails: form.scopeDetails.trim(),
        status: 'submitted',
        source,
        adminNote: null,
        quotedAmount: null,
        quotedAt: null,
        closedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setIsSuccess(true);
    } catch (submitError) {
      console.error('Quote request submission failed:', submitError);
      setError('Quote request could not be submitted. Try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[620px] bg-white px-4 pt-32 pb-20">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-teal/10 text-teal">
            <Send size={36} />
          </div>
          <h2 className="text-4xl font-display uppercase">Quote Request Submitted</h2>
          <p className="mt-4 text-sm uppercase tracking-widest text-charcoal/60">
            Our admin team has it in queue and will respond via your preferred contact method.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 pt-32 pb-20 text-charcoal">
      <div className="mx-auto max-w-3xl">
        <header className="mb-12 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-teal">Complex Service Quote</p>
          <h1 className="mt-4 text-4xl font-display uppercase tracking-wide">Request A Tailored Quote</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-charcoal/60">
            Use this flow for commercial or industrial scopes that need site-specific pricing and operational planning.
          </p>
        </header>

        {!customerSession ? (
          <div className="frost-card-light p-8 md:p-10">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-teal/10 text-teal">
              <LogIn size={28} />
            </div>
            <h2 className="text-2xl font-display uppercase tracking-wider">Sign In To Continue</h2>
            <p className="mt-3 text-sm leading-relaxed text-charcoal/60">
              Quote requests are tied to customer accounts so your team and admin can track history and responses.
            </p>
            {user && (
              <div className="mt-6 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-xs text-amber-700">
                Signed in as {user.email || 'workforce user'}. Continue with Google customer sign-in to submit this request.
              </div>
            )}
            <label className="mt-6 flex items-center gap-3 rounded-xl border border-charcoal/10 bg-white px-4 py-3">
              <input
                type="checkbox"
                checked={stayLoggedIn}
                onChange={(event) => setStayLoggedIn(event.target.checked)}
                className="h-4 w-4 accent-teal"
              />
              <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal/70">
                Stay logged in on this device
              </span>
            </label>
            <button
              type="button"
              onClick={handleCustomerGoogleSignIn}
              disabled={authLoading}
              className="btn-primary mt-6 w-full disabled:opacity-50"
            >
              {authLoading ? 'SYNCING ACCOUNT...' : 'CONTINUE WITH GOOGLE'}
            </button>
            {error && (
              <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-500">
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="frost-card-light p-8">
              <div className="mb-6 flex items-center gap-3">
                <Building2 size={18} className="text-teal" />
                <h2 className="text-sm font-bold uppercase tracking-widest">Scope Intake</h2>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-charcoal/60">Complex Service</label>
                  <select
                    value={form.serviceId}
                    onChange={(event) => setForm((prev) => ({ ...prev, serviceId: event.target.value }))}
                    className="input-field-light"
                  >
                    {complexServices.map((service) => (
                      <option key={service.id} value={service.id}>{service.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-charcoal/60">Contact Preference</label>
                  <select
                    value={form.preferredContact}
                    onChange={(event) => setForm((prev) => ({ ...prev, preferredContact: event.target.value }))}
                    className="input-field-light"
                  >
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-charcoal/60">Customer Name</label>
                  <input
                    type="text"
                    value={form.customerName}
                    onChange={(event) => setForm((prev) => ({ ...prev, customerName: event.target.value }))}
                    className="input-field-light"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-charcoal/60">Customer Email</label>
                  <input
                    type="email"
                    value={form.customerEmail}
                    className="input-field-light"
                    disabled
                  />
                  <p className="mt-1 text-[10px] uppercase tracking-widest text-charcoal/55">Uses your signed-in Google account email</p>
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-charcoal/60">Phone Number</label>
                  <input
                    type="tel"
                    value={form.phoneNumber}
                    onChange={(event) => setForm((prev) => ({ ...prev, phoneNumber: event.target.value }))}
                    className="input-field-light"
                    placeholder="07425 241192"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-charcoal/60">Company / Site Name (Optional)</label>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(event) => setForm((prev) => ({ ...prev, companyName: event.target.value }))}
                    className="input-field-light"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-charcoal/60">Address</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                    className="input-field-light"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-charcoal/60">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                    className="input-field-light"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-charcoal/60">Postcode</label>
                  <input
                    type="text"
                    value={form.postcode}
                    onChange={(event) => setForm((prev) => ({ ...prev, postcode: event.target.value }))}
                    className="input-field-light"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-charcoal/60">Service Frequency</label>
                  <select
                    value={form.frequency}
                    onChange={(event) => setForm((prev) => ({ ...prev, frequency: event.target.value }))}
                    className="input-field-light"
                  >
                    <option value="one_off">One-off</option>
                    <option value="weekly">Weekly</option>
                    <option value="fortnightly">Fortnightly</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-charcoal/60">Preferred Schedule (Optional)</label>
                  <input
                    type="text"
                    value={form.preferredSchedule}
                    onChange={(event) => setForm((prev) => ({ ...prev, preferredSchedule: event.target.value }))}
                    className="input-field-light"
                    placeholder="Weekday evenings, after 6 PM"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-charcoal/60">Budget Range (Optional)</label>
                  <input
                    type="text"
                    value={form.budgetRange}
                    onChange={(event) => setForm((prev) => ({ ...prev, budgetRange: event.target.value }))}
                    className="input-field-light"
                    placeholder="e.g. £500 - £900 monthly"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-charcoal/60">Scope Summary</label>
                  <input
                    type="text"
                    value={form.scopeSummary}
                    onChange={(event) => setForm((prev) => ({ ...prev, scopeSummary: event.target.value }))}
                    className="input-field-light"
                    placeholder="What should be cleaned and how often?"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-charcoal/60">Scope Details</label>
                  <textarea
                    value={form.scopeDetails}
                    onChange={(event) => setForm((prev) => ({ ...prev, scopeDetails: event.target.value }))}
                    className="input-field-light min-h-40"
                    placeholder="Share complexity, access constraints, preferred chemicals/equipment, compliance, and any special instructions."
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-500">
                {error}
              </div>
            )}

            <div className="frost-card-light p-6">
              <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-charcoal/60">
                <MessageSquareText size={14} className="text-teal" />
                Admin handling
              </div>
              <p className="text-sm text-charcoal/70">
                Your request enters the admin quote queue with status <strong>Submitted</strong>, then moves through <strong>Reviewing</strong>, <strong>Quoted</strong>, and <strong>Closed</strong>.
              </p>
              <button
                type="button"
                onClick={submitQuoteRequest}
                disabled={submitting}
                className="btn-primary mt-6 w-full disabled:opacity-50"
              >
                {submitting ? 'SUBMITTING REQUEST...' : 'SUBMIT QUOTE REQUEST'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
