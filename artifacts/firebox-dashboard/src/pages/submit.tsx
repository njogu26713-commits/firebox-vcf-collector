import { useState } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, CheckCircle2, AlertCircle, Loader2, Users, Target, Globe } from 'lucide-react';
import { getCountryByCode } from '@/lib/countries';

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

class CampaignNotFoundError extends Error {}
class CampaignServiceError extends Error {}

async function fetchCampaignByToken(token: string) {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/campaigns/by-token/${token}`);
  } catch {
    throw new CampaignServiceError('Network error');
  }
  if (res.status === 404) throw new CampaignNotFoundError('Campaign not found');
  if (!res.ok) throw new CampaignServiceError(`Service error ${res.status}`);
  return res.json();
}

async function submitContact(campaignId: string, data: { name: string; phone: string; consent: boolean }) {
  const res = await fetch(`${API_BASE}/api/campaigns/${campaignId}/contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Submission failed');
  return json;
}

export default function SubmitPage() {
  const { token } = useParams<{ token: string }>();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: campaign, isLoading, isError, error } = useQuery({
    queryKey: ['campaign-by-token', token],
    queryFn: () => fetchCampaignByToken(token!),
    enabled: !!token,
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: (data: { name: string; phone: string; consent: boolean }) =>
      submitContact(campaign.id, data),
    onSuccess: () => setSubmitted(true),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ name: name.trim(), phone: phone.trim(), consent });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Not found / error
  if (isError || !campaign) {
    const isServiceError = error instanceof CampaignServiceError;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">
            {isServiceError ? 'Temporarily unavailable' : 'Link not found'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isServiceError
              ? 'The service is temporarily unavailable. Please try again in a moment.'
              : 'This campaign link is invalid or no longer available.'}
          </p>
        </div>
      </div>
    );
  }

  // Campaign not active
  if (campaign.status !== 'active') {
    const isCompleted = campaign.status === 'completed';
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center">
          <CheckCircle2 className={`w-12 h-12 mx-auto mb-4 ${isCompleted ? 'text-primary' : 'text-muted-foreground'}`} />
          <h1 className="text-xl font-bold text-foreground mb-2">
            {isCompleted ? 'Campaign complete!' : 'Not accepting submissions'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isCompleted
              ? `"${campaign.title}" has reached its target. Thanks to everyone who joined!`
              : `"${campaign.title}" is not currently accepting new contacts.`}
          </p>
        </div>
      </div>
    );
  }

  const progress = campaign.progressPercent ?? 0;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">You're in!</h1>
            <p className="text-muted-foreground">
              Your contact has been added to <span className="font-semibold text-foreground">{campaign.title}</span>.
              You'll be notified when the VCF unlocks.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="max-w-md w-full"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
                <Flame className="w-3.5 h-3.5 animate-pulse" />
                Firebox Campaign
              </div>
              <h1 className="text-3xl font-extrabold text-foreground mb-2">{campaign.title}</h1>
              {campaign.description && (
                <p className="text-muted-foreground text-sm leading-relaxed">{campaign.description}</p>
              )}
            </div>

            {/* Progress card */}
            <div className="bg-card border border-border rounded-2xl p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{campaign.contactsCollected} joined</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Target className="w-4 h-4" />
                  <span>{campaign.targetContacts} target</span>
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-right">{progress}% complete</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="name">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Jane Smith"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="phone">
                  Phone number
                </label>
                {campaign.allowedCountryCode ? (() => {
                  const country = getCountryByCode(campaign.allowedCountryCode);
                  return (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary border border-border rounded-lg px-3 py-2">
                      <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>
                        Only {country ? `${country.flag} ${country.name} (${country.dialCode})` : campaign.allowedCountryCode} numbers accepted.
                        Include your dial code, e.g. <span className="font-mono font-semibold text-foreground">{country?.dialCode ?? '+'} 800 000 0000</span>
                      </span>
                    </div>
                  );
                })() : (
                  <p className="text-xs text-muted-foreground">Include your country dial code, e.g. +1 555 000 0000</p>
                )}
                <input
                  id="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder={campaign.allowedCountryCode ? `${getCountryByCode(campaign.allowedCountryCode)?.dialCode ?? '+'} 000 000 0000` : '+1 555 000 0000'}
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={e => setConsent(e.target.checked)}
                  className="mt-0.5 accent-primary w-4 h-4 flex-shrink-0"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  I agree to share my name and phone number to be added to this contact list.
                </span>
              </label>

              {mutation.isError && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {mutation.error?.message ?? 'Something went wrong. Please try again.'}
                </div>
              )}

              <button
                type="submit"
                disabled={mutation.isPending || !consent}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Flame className="w-4 h-4" />
                    Join this campaign
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
