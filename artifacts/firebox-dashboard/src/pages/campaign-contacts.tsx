import { useParams, Link } from 'wouter';
import { useGetCampaign, useListCampaignContacts } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Phone, User, Copy, Download, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

function statClass(status: string) {
  if (status === 'active') return 'bg-primary/10 text-primary border-primary/20';
  if (status === 'completed') return 'bg-green-500/10 text-green-400 border-green-500/20';
  return 'bg-secondary text-muted-foreground border-border';
}

export default function CampaignContacts() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { data: campaign, isLoading: loadingCampaign } = useGetCampaign(id!);
  const { data: contacts, isLoading: loadingContacts } = useListCampaignContacts(id!);

  const isLoading = loadingCampaign || loadingContacts;

  const handleCopyPhone = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      toast({ title: 'Phone number copied!' });
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const handleDownloadVcf = () => {
    window.open(`/api/campaigns/${id}/vcf`, '_blank');
  };

  const handleExportCsv = () => {
    if (!contacts || contacts.length === 0) return;
    const rows = [
      ['Name', 'Phone', 'Submitted At'],
      ...contacts.map(c => [
        c.name,
        c.phone,
        c.submittedAt ? format(new Date(c.submittedAt), 'yyyy-MM-dd HH:mm:ss') : '',
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${campaign?.title ?? 'contacts'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const percent = campaign
    ? Math.min(100, Math.round((campaign.contactsCollected / campaign.targetContacts) * 100))
    : 0;

  const isCompleted = campaign ? campaign.contactsCollected >= campaign.targetContacts : false;

  return (
    <div className="space-y-8 pb-10">
      {/* Back + header */}
      <div>
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to campaigns
        </Link>

        {loadingCampaign ? (
          <div className="space-y-3">
            <Skeleton className="h-9 w-64 bg-card" />
            <Skeleton className="h-4 w-40 bg-card" />
          </div>
        ) : campaign ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                  {campaign.title}
                </h1>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statClass(campaign.status)}`}>
                  {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
                {campaign.contactsCollected} of {campaign.targetContacts} contacts registered
              </p>
            </div>

            <div className="flex items-center gap-2">
              {contacts && contacts.length > 0 && (
                <button
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              )}
              <button
                onClick={handleDownloadVcf}
                disabled={!isCompleted}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isCompleted
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(22,163,74,0.3)]'
                    : 'bg-card border border-border text-muted-foreground cursor-not-allowed opacity-60'}
                `}
              >
                {isCompleted ? <Download className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                Download VCF
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Progress bar */}
      {campaign && !loadingCampaign && (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Registered</p>
              <p className="text-2xl font-extrabold text-foreground">{campaign.contactsCollected}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Target</p>
              <p className="text-2xl font-extrabold text-foreground">{campaign.targetContacts}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Remaining</p>
              <p className="text-2xl font-extrabold text-foreground">
                {Math.max(0, campaign.targetContacts - campaign.contactsCollected)}
              </p>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span className="font-bold text-foreground">{percent}%</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full rounded-full ${isCompleted ? 'bg-green-500' : 'bg-primary shadow-[0_0_8px_rgba(22,163,74,0.4)]'}`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Contact list */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-border">
          <Users className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground">
            Registered Contacts
            {contacts && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">({contacts.length})</span>
            )}
          </h2>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl bg-secondary/50" />
            ))}
          </div>
        ) : !contacts || contacts.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground mb-1">No contacts yet</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Share your campaign link and contacts will appear here as people register.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {contacts.map((contact, i) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
                className="flex items-center justify-between px-6 py-4 hover:bg-secondary/30 transition-colors group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{contact.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                      <p className="text-sm text-muted-foreground font-mono">{contact.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {contact.submittedAt && (
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      {format(new Date(contact.submittedAt), 'MMM d, yyyy · h:mm a')}
                    </p>
                  )}
                  <button
                    onClick={() => handleCopyPhone(contact.phone)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary opacity-0 group-hover:opacity-100 transition-all outline-none"
                    title="Copy phone number"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
