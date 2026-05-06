import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mail,
  Send,
  Users,
  Eye,
  History,
  PenLine,
} from 'lucide-react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/firebase';

type Tab = 'compose' | 'history';
type Audience = 'all' | 'inactive_30d' | 'recent_30d' | 'new';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  audience: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  status: string;
  createdAt: unknown;
}

const audienceOptions: { value: Audience; label: string; description: string }[] = [
  { value: 'all', label: 'All Customers', description: 'Every customer who accepts marketing emails' },
  { value: 'inactive_30d', label: 'Inactive 30+ days', description: 'No booking in the last 30 days' },
  { value: 'recent_30d', label: 'Recent 30 days', description: 'Booked within the last 30 days' },
  { value: 'new', label: 'New Customers', description: 'Only 1 booking on record' },
];

function readTimestampLabel(value: unknown) {
  if (!value) return '—';
  if (typeof value === 'string') return new Date(value).toLocaleString();
  const seconds = (value as { seconds?: number })?.seconds;
  if (typeof seconds === 'number') return new Date(seconds * 1000).toLocaleString();
  const toDate = (value as { toDate?: () => Date }).toDate;
  if (typeof toDate === 'function') return toDate().toLocaleString();
  return '—';
}

function statusBadgeClass(status: string) {
  if (status === 'sending') return 'bg-amber-500/15 text-amber-300 border-amber-400/25';
  if (status === 'completed') return 'bg-teal/15 text-teal border-teal/35';
  return 'bg-white/10 text-white/65 border-white/15';
}

export const AdminBroadcasts: React.FC = () => {
  const [tab, setTab] = React.useState<Tab>('compose');

  // Compose state
  const [campaignName, setCampaignName] = React.useState('');
  const [subject, setSubject] = React.useState('');
  const [bodyHtml, setBodyHtml] = React.useState('');
  const [audience, setAudience] = React.useState<Audience>('all');
  const [ctaText, setCtaText] = React.useState('');
  const [ctaUrl, setCtaUrl] = React.useState('');
  const [audienceCount, setAudienceCount] = React.useState<number | null>(null);
  const [loadingCount, setLoadingCount] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [showPreview, setShowPreview] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  // History state
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [loadingHistory, setLoadingHistory] = React.useState(true);

  // Load campaigns for history tab
  React.useEffect(() => {
    const q = query(collection(db, 'campaigns'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        setCampaigns(
          snapshot.docs.map((entry) => ({
            id: entry.id,
            ...(entry.data() as Omit<Campaign, 'id'>),
          })),
        );
        setLoadingHistory(false);
      },
      () => setLoadingHistory(false),
    );
  }, []);

  // Fetch audience count when audience changes
  React.useEffect(() => {
    let active = true;
    setLoadingCount(true);
    setAudienceCount(null);

    const fetchCount = async () => {
      try {
        const getCount = httpsCallable<{ audience: string }, { count: number }>(functions, 'getAudienceCount');
        const result = await getCount({ audience });
        if (active) setAudienceCount(result.data.count);
      } catch {
        if (active) setAudienceCount(null);
      } finally {
        if (active) setLoadingCount(false);
      }
    };

    fetchCount();
    return () => { active = false; };
  }, [audience]);

  const handleSend = async () => {
    setShowConfirm(false);
    setError(null);
    setSuccess(null);
    setSending(true);

    try {
      const sendBroadcast = httpsCallable<Record<string, unknown>, { campaignId: string; sentCount: number; failedCount: number }>(
        functions,
        'sendBroadcastEmail',
      );
      const result = await sendBroadcast({
        campaignName,
        subject,
        bodyHtml: `<p>${bodyHtml.replace(/\n/g, '</p><p>')}</p>`,
        audience,
        ctaText: ctaText || undefined,
        ctaUrl: ctaUrl || undefined,
      });
      setSuccess(`Campaign sent! ${result.data.sentCount} delivered, ${result.data.failedCount} failed.`);
      setCampaignName('');
      setSubject('');
      setBodyHtml('');
      setCtaText('');
      setCtaUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send broadcast.');
    } finally {
      setSending(false);
    }
  };

  const canSend = subject.trim() && bodyHtml.trim() && campaignName.trim();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Mail className="text-teal" size={28} />
        <h1 className="text-2xl font-display uppercase tracking-widest">Broadcasts</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-white/5 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('compose')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-xs font-bold uppercase tracking-widest transition-colors ${
            tab === 'compose' ? 'bg-teal text-charcoal' : 'text-white/60 hover:text-white'
          }`}
        >
          <PenLine size={14} /> Compose
        </button>
        <button
          onClick={() => setTab('history')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-xs font-bold uppercase tracking-widest transition-colors ${
            tab === 'history' ? 'bg-teal text-charcoal' : 'text-white/60 hover:text-white'
          }`}
        >
          <History size={14} /> History
        </button>
      </div>

      {/* Compose Tab */}
      {tab === 'compose' && (
        <div className="space-y-6">
          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/25 rounded-lg p-4">
              <AlertCircle className="text-red-400 shrink-0" size={18} />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 bg-teal/10 border border-teal/25 rounded-lg p-4">
              <CheckCircle2 className="text-teal shrink-0" size={18} />
              <p className="text-sm text-teal">{success}</p>
            </div>
          )}

          {/* Campaign Name */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">
              Campaign Name
            </label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g. May 2026 Promo"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-teal/50"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">
              Email Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Spring cleaning special — 20% off"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-teal/50"
            />
          </div>

          {/* Audience Selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">
              Audience
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {audienceOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAudience(opt.value)}
                  className={`text-left p-3 rounded-lg border transition-colors ${
                    audience === opt.value
                      ? 'bg-teal/10 border-teal/40 text-teal'
                      : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                  }`}
                >
                  <p className="text-xs font-bold">{opt.label}</p>
                  <p className="text-[10px] mt-1 opacity-70">{opt.description}</p>
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-white/60">
              <Users size={14} />
              {loadingCount ? (
                <span className="flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Counting…</span>
              ) : audienceCount !== null ? (
                <span><strong className="text-white">{audienceCount}</strong> recipients</span>
              ) : (
                <span>Unable to load count</span>
              )}
            </div>
          </div>

          {/* Body */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">
              Email Body
            </label>
            <textarea
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              placeholder="Write the email body here. Line breaks become paragraphs."
              rows={8}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-teal/50 resize-y"
            />
          </div>

          {/* Optional CTA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">
                CTA Button Text <span className="text-white/30">(optional)</span>
              </label>
              <input
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="e.g. Book Now"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-teal/50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">
                CTA URL <span className="text-white/30">(optional)</span>
              </label>
              <input
                type="url"
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-teal/50"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-5 py-3 border border-white/15 rounded-lg text-xs font-bold uppercase tracking-widest text-white/70 hover:text-white hover:border-white/30 transition-colors"
            >
              <Eye size={14} /> Preview
            </button>

            <button
              onClick={() => setShowConfirm(true)}
              disabled={!canSend || sending}
              className="flex items-center gap-2 px-6 py-3 bg-teal text-charcoal rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-teal/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending ? (
                <><Loader2 size={14} className="animate-spin" /> Sending…</>
              ) : (
                <><Send size={14} /> Send Broadcast</>
              )}
            </button>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="mt-6 bg-white/5 border border-white/10 rounded-lg p-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4">Email Preview</p>
              <div className="bg-white rounded-lg p-6 text-charcoal">
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <p className="text-xs text-gray-500">Subject: <strong className="text-charcoal">{subject || '(no subject)'}</strong></p>
                </div>
                <p className="text-sm text-gray-600 mb-3">Hi {'{{customerName}}'},</p>
                {bodyHtml.split('\n').filter(Boolean).map((line, i) => (
                  <p key={i} className="text-sm text-gray-800 mb-2">{line}</p>
                ))}
                {ctaText && (
                  <div className="mt-4">
                    <span className="inline-block bg-[#00F5D4] text-charcoal px-6 py-2.5 rounded text-xs font-bold uppercase tracking-widest">
                      {ctaText}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Confirm dialog */}
          {showConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="bg-charcoal border border-white/10 rounded-xl p-6 max-w-md w-full shadow-2xl">
                <h3 className="text-lg font-display uppercase tracking-widest mb-4">Confirm Send</h3>
                <p className="text-sm text-white/70 mb-2">
                  You are about to send <strong className="text-white">&quot;{subject}&quot;</strong> to{' '}
                  <strong className="text-teal">{audienceCount ?? '?'} recipients</strong>.
                </p>
                <p className="text-xs text-white/50 mb-6">This action cannot be undone.</p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="px-4 py-2 border border-white/15 rounded-lg text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSend}
                    className="px-5 py-2 bg-teal text-charcoal rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-teal/90"
                  >
                    Confirm &amp; Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div>
          {loadingHistory ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-teal" size={28} />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-16 text-white/40">
              <Mail size={32} className="mx-auto mb-4 opacity-40" />
              <p className="text-sm">No campaigns sent yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] font-bold uppercase tracking-widest text-white/40 border-b border-white/10">
                    <th className="text-left py-3 pr-4">Campaign</th>
                    <th className="text-left py-3 pr-4">Subject</th>
                    <th className="text-left py-3 pr-4">Audience</th>
                    <th className="text-right py-3 pr-4">Sent</th>
                    <th className="text-right py-3 pr-4">Failed</th>
                    <th className="text-left py-3 pr-4">Status</th>
                    <th className="text-left py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-b border-white/5 hover:bg-white/3">
                      <td className="py-3 pr-4 font-medium text-white">{campaign.name}</td>
                      <td className="py-3 pr-4 text-white/70 max-w-[200px] truncate">{campaign.subject}</td>
                      <td className="py-3 pr-4 text-white/60 capitalize">{campaign.audience?.replace(/_/g, ' ') || 'all'}</td>
                      <td className="py-3 pr-4 text-right text-teal font-bold">{campaign.sentCount}</td>
                      <td className="py-3 pr-4 text-right text-red-400">{campaign.failedCount || 0}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusBadgeClass(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="py-3 text-white/50">{readTimestampLabel(campaign.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
