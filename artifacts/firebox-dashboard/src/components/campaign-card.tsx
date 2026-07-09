import React from 'react';
import { motion } from 'framer-motion';
import { Copy, Download, Edit2, ExternalLink, Link as LinkIcon, Lock, Trash2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useDeleteCampaign, getListCampaignsQueryKey, getGetDashboardStatsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { Campaign } from '@workspace/api-client-react';

export function CampaignCard({ campaign, index = 0 }: { campaign: Campaign; index?: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteCampaign();

  const shareUrl = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, '')}/submit/${campaign.shareToken}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: 'Link copied to clipboard!' });
    } catch (err) {
      toast({ title: 'Failed to copy link', variant: 'destructive' });
    }
  };

  const handleDownload = () => {
    if (campaign.contactsCollected < campaign.targetContacts) {
      toast({ title: 'Target not reached', description: 'Cannot download VCF yet.', variant: 'destructive' });
      return;
    }
    window.open(`/api/campaigns/${campaign.id}/vcf`, '_blank');
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: campaign.id }, {
      onSuccess: () => {
        toast({ title: 'Campaign deleted' });
        queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
      },
      onError: () => {
        toast({ title: 'Failed to delete campaign', variant: 'destructive' });
      }
    });
  };

  const isCompleted = campaign.contactsCollected >= campaign.targetContacts;
  const isDraft = campaign.status === 'draft';
  const isActive = campaign.status === 'active';
  const percent = Math.min(Math.round((campaign.contactsCollected / campaign.targetContacts) * 100), 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={`
        relative bg-card rounded-[18px] border border-border p-6 flex flex-col gap-5
        hover:shadow-lg transition-all duration-300 group
        ${isActive ? 'border-l-[3px] border-l-primary hover:shadow-[0_4px_30px_rgba(22,163,74,0.12)]' : ''}
        ${isCompleted ? 'border-l-[3px] border-l-green-500/50' : ''}
      `}
      data-testid={`campaign-card-${campaign.id}`}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-lg text-foreground truncate" title={campaign.title}>{campaign.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Created {format(new Date(campaign.createdAt), 'MMM d, yyyy')}
          </p>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap
          ${isDraft ? 'bg-secondary text-muted-foreground border-border' : ''}
          ${isActive ? 'bg-primary/10 text-primary border-primary/20 shadow-[0_0_10px_rgba(22,163,74,0.2)]' : ''}
          ${isCompleted ? 'bg-green-500/10 text-green-400 border-green-500/20' : ''}
        `}>
          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
        </div>
      </div>

      {/* WhatsApp group link — shown when set */}
      {(campaign as any).groupLink && (
        <a
          href={(campaign as any).groupLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-green-500/25 bg-green-500/5 hover:bg-green-500/10 transition-colors group -mt-1"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-green-500 shrink-0">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <span className="text-xs text-green-400 font-medium flex-1 truncate">WhatsApp Group</span>
          <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-green-400 transition-colors shrink-0" />
        </a>
      )}

      <div className="grid grid-cols-3 gap-2 py-3 border-y border-border/50">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground mb-1">Target</span>
          <span className="font-bold text-foreground text-lg leading-none">{campaign.targetContacts}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground mb-1">Collected</span>
          <span className="font-bold text-foreground text-lg leading-none">{campaign.contactsCollected}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground mb-1">Remaining</span>
          <span className="font-bold text-foreground text-lg leading-none">{Math.max(0, campaign.targetContacts - campaign.contactsCollected)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground font-medium">Progress</span>
          <span className="text-foreground font-bold">{percent}%</span>
        </div>
        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full ${isCompleted ? 'bg-green-500' : 'bg-primary shadow-[0_0_8px_rgba(22,163,74,0.4)]'}`}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto pt-2">
        <div className="flex items-center gap-1.5">
          <button 
            onClick={handleCopyLink}
            disabled={isDraft}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed outline-none"
            title="Copy Link"
            data-testid={`btn-copy-${campaign.id}`}
          >
            <Copy className="w-4 h-4" />
          </button>
          <a 
            href={shareUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors outline-none ${isDraft ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
            title="Open Share Link"
            data-testid={`link-share-${campaign.id}`}
          >
            <LinkIcon className="w-4 h-4" />
          </a>
          <button 
            onClick={handleDownload}
            disabled={!isCompleted}
            className={`p-2 rounded-lg transition-colors outline-none flex items-center justify-center
              ${isCompleted ? 'text-primary hover:bg-primary/10' : 'text-muted-foreground/50 cursor-not-allowed'}
            `}
            title={isCompleted ? "Download VCF" : "Locked until target reached"}
            data-testid={`btn-download-${campaign.id}`}
          >
            {isCompleted ? <Download className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href={`/campaigns/${campaign.id}/contacts`}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors outline-none"
            title="View Registered Contacts"
            data-testid={`link-contacts-${campaign.id}`}
          >
            <Users className="w-4 h-4" />
          </Link>
          <Link 
            href={`/edit/${campaign.id}`}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors outline-none"
            title="Edit Campaign"
            data-testid={`link-edit-${campaign.id}`}
          >
            <Edit2 className="w-4 h-4" />
          </Link>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button 
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors outline-none"
                title="Delete Campaign"
                data-testid={`btn-delete-${campaign.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border shadow-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-foreground">Delete Campaign</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  Are you sure you want to delete "{campaign.title}"? This action cannot be undone and will delete all collected contacts.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-secondary text-foreground hover:bg-secondary/80 border-0">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </motion.div>
  );
}