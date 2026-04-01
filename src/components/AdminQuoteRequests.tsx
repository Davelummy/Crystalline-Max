import React from 'react';
import { AlertCircle, CheckCircle2, ClipboardList, Loader2 } from 'lucide-react';
import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import type { QuoteRequestRecord, QuoteRequestStatus } from '@/types';

function readTimestampLabel(value: unknown) {
  if (!value) return 'Pending';
  if (typeof value === 'string') return new Date(value).toLocaleString();
  const seconds = (value as { seconds?: number })?.seconds;
  if (typeof seconds === 'number') return new Date(seconds * 1000).toLocaleString();
  const toDate = (value as { toDate?: () => Date }).toDate;
  if (typeof toDate === 'function') return toDate().toLocaleString();
  return 'Pending';
}

function statusBadgeClass(status: QuoteRequestStatus) {
  if (status === 'submitted') return 'bg-amber-500/15 text-amber-300 border-amber-400/25';
  if (status === 'reviewing') return 'bg-sky-500/15 text-sky-300 border-sky-400/25';
  if (status === 'quoted') return 'bg-teal/15 text-teal border-teal/35';
  return 'bg-white/10 text-white/65 border-white/15';
}

export const AdminQuoteRequests: React.FC = () => {
  const [records, setRecords] = React.useState<QuoteRequestRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [drafts, setDrafts] = React.useState<Record<string, { status: QuoteRequestStatus; adminNote: string; quotedAmount: string }>>({});

  React.useEffect(() => {
    const q = query(collection(db, 'quoteRequests'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const nextRecords = snapshot.docs.map((entry) => ({
        id: entry.id,
        ...(entry.data() as Omit<QuoteRequestRecord, 'id'>),
      }));
      setRecords(nextRecords);
      setDrafts((previous) => {
        const merged = { ...previous };
        nextRecords.forEach((record) => {
          if (!merged[record.id]) {
            merged[record.id] = {
              status: record.status,
              adminNote: record.adminNote || '',
              quotedAmount: record.quotedAmount != null ? String(record.quotedAmount) : '',
            };
          }
        });
        return merged;
      });
      setLoading(false);
    }, () => setLoading(false));
  }, []);

  const submittedCount = records.filter((record) => record.status === 'submitted').length;
  const reviewingCount = records.filter((record) => record.status === 'reviewing').length;
  const quotedCount = records.filter((record) => record.status === 'quoted').length;

  const saveDraft = async (record: QuoteRequestRecord) => {
    const draft = drafts[record.id];
    if (!draft) return;

    setSavingId(record.id);

    const nextStatus = draft.status;
    const quotedAmount = draft.quotedAmount.trim() ? Number(draft.quotedAmount) : null;
    const updatePayload: Record<string, unknown> = {
      status: nextStatus,
      adminNote: draft.adminNote.trim() || null,
      quotedAmount: Number.isFinite(quotedAmount) ? quotedAmount : null,
      updatedAt: serverTimestamp(),
    };

    if (nextStatus === 'quoted') {
      updatePayload.quotedAt = serverTimestamp();
    }
    if (nextStatus === 'closed') {
      updatePayload.closedAt = serverTimestamp();
    }

    try {
      await updateDoc(doc(db, 'quoteRequests', record.id), updatePayload);
    } catch (error) {
      console.error('Failed to update quote request:', error);
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <div className="pt-32 text-center">Loading Quote Requests...</div>;
  }

  return (
    <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-display uppercase tracking-wider">Quote Requests</h1>
          <p className="mt-3 text-charcoal/60">
            Complex-service requests submitted from public and customer quote flows.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="dark-card px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-white/60">Submitted</p>
            <p className="text-xl font-display text-amber-300">{submittedCount}</p>
          </div>
          <div className="dark-card px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-white/60">Reviewing</p>
            <p className="text-xl font-display text-sky-300">{reviewingCount}</p>
          </div>
          <div className="dark-card px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-white/60">Quoted</p>
            <p className="text-xl font-display text-teal">{quotedCount}</p>
          </div>
        </div>
      </header>

      <div className="space-y-6">
        {records.length === 0 ? (
          <div className="dark-card p-10 text-center">
            <AlertCircle className="mx-auto mb-4 text-white/30" size={30} />
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">No quote requests submitted yet</p>
          </div>
        ) : (
          records.map((record) => {
            const draft = drafts[record.id] || {
              status: record.status,
              adminNote: record.adminNote || '',
              quotedAmount: record.quotedAmount != null ? String(record.quotedAmount) : '',
            };

            return (
              <article key={record.id} className="dark-card p-6">
                <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-teal">Request #{record.id.slice(0, 8)}</p>
                    <h2 className="mt-2 text-lg font-bold uppercase tracking-wider">{record.customerName}</h2>
                    <p className="mt-2 text-[10px] uppercase tracking-widest text-white/60">
                      {record.serviceLabel} · {record.city} {record.postcode}
                    </p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${statusBadgeClass(record.status)}`}>
                    {record.status}
                  </span>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3 text-sm text-white/80">
                    <p><span className="text-white/55 uppercase tracking-widest text-[10px] font-bold">Email:</span> {record.customerEmail}</p>
                    <p><span className="text-white/55 uppercase tracking-widest text-[10px] font-bold">Phone:</span> {record.phoneNumber}</p>
                    <p><span className="text-white/55 uppercase tracking-widest text-[10px] font-bold">Address:</span> {record.address}, {record.city}, {record.postcode}</p>
                    <p><span className="text-white/55 uppercase tracking-widest text-[10px] font-bold">Frequency:</span> {record.frequency.replace('_', ' ')}</p>
                    <p><span className="text-white/55 uppercase tracking-widest text-[10px] font-bold">Preferred Contact:</span> {record.preferredContact}</p>
                    <p><span className="text-white/55 uppercase tracking-widest text-[10px] font-bold">Preferred Schedule:</span> {record.preferredSchedule || 'Not specified'}</p>
                    <p><span className="text-white/55 uppercase tracking-widest text-[10px] font-bold">Budget:</span> {record.budgetRange || 'Not specified'}</p>
                    <p><span className="text-white/55 uppercase tracking-widest text-[10px] font-bold">Submitted:</span> {readTimestampLabel(record.createdAt)}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/65">Scope Summary</p>
                      <p className="mt-2 text-sm text-white/80">{record.scopeSummary}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/65">Scope Details</p>
                      <p className="mt-2 text-sm whitespace-pre-wrap text-white/80">{record.scopeDetails}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-white/60">Status</label>
                    <select
                      value={draft.status}
                      onChange={(event) => setDrafts((prev) => ({ ...prev, [record.id]: { ...draft, status: event.target.value as QuoteRequestStatus } }))}
                      className="input-field"
                    >
                      <option value="submitted">Submitted</option>
                      <option value="reviewing">Reviewing</option>
                      <option value="quoted">Quoted</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-white/60">Quoted Amount (GBP)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.quotedAmount}
                      onChange={(event) => setDrafts((prev) => ({ ...prev, [record.id]: { ...draft, quotedAmount: event.target.value } }))}
                      className="input-field"
                      placeholder="e.g. 625.00"
                    />
                  </div>
                  <div className="md:col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={() => void saveDraft(record)}
                      disabled={savingId === record.id}
                      className="btn-primary w-full disabled:opacity-50"
                    >
                      {savingId === record.id ? (
                        <span className="inline-flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Saving</span>
                      ) : (
                        <span className="inline-flex items-center gap-2"><CheckCircle2 size={14} /> Save Update</span>
                      )}
                    </button>
                  </div>
                  <div className="md:col-span-3">
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-white/60">Admin Note</label>
                    <textarea
                      value={draft.adminNote}
                      onChange={(event) => setDrafts((prev) => ({ ...prev, [record.id]: { ...draft, adminNote: event.target.value } }))}
                      className="input-field min-h-28"
                      placeholder="Internal review notes, follow-up actions, pricing assumptions, or contact attempts."
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/50">
                  <ClipboardList size={12} className="text-teal" />
                  Last updated {readTimestampLabel(record.updatedAt)}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};
