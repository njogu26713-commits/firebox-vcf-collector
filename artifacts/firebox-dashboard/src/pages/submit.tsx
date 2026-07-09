import { useState } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, CheckCircle2, AlertCircle, Loader2, Users, Target, Globe, MessageCircle, ExternalLink } from 'lucide-react';
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
  const [whatsappConsent, setWhatsappConsent] = useState(false);
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
    if (campaign.requireWhatsapp && !whatsappConsent) return;
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
            <p className="text-muted-foreground mb-6">
              Your contact has been added to <span className="font-semibold text-foreground">{campaign.title}</span>.
            </p>

            {campaign.groupLink ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Join the WhatsApp group — the VCF will be dropped there once the target is reached.
                </p>
                <a
                  href={campaign.groupLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white shrink-0">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Join WhatsApp Group
                  <ExternalLink className="w-4 h-4 opacity-70" />
                </a>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                You'll be notified when the VCF unlocks.
              </p>
            )}
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

              {campaign.requireWhatsapp && (
                <>
                  <div className="flex items-center gap-2 text-xs font-medium text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                    <MessageCircle className="w-4 h-4 flex-shrink-0" />
                    This campaign requires an active WhatsApp number.
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      required
                      checked={whatsappConsent}
                      onChange={e => setWhatsappConsent(e.target.checked)}
                      className="mt-0.5 accent-primary w-4 h-4 flex-shrink-0"
                    />
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      My number above is active on WhatsApp.
                    </span>
                  </label>
                </>
              )}

              {mutation.isError && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {mutation.error?.message ?? 'Something went wrong. Please try again.'}
                </div>
              )}

              <button
                type="submit"
                disabled={mutation.isPending || !consent || (campaign.requireWhatsapp && !whatsappConsent)}
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
