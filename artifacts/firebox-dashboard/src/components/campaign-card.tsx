import React from 'react';
import { motion } from 'framer-motion';
import { Copy, Download, Edit2, Link as LinkIcon, Lock, Trash2 } from 'lucide-react';
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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(campaign.shareLink);
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
        ${isActive ? 'border-l-[3px] border-l-primary hover:shadow-[0_4px_30px_rgba(255,106,0,0.12)]' : ''}
        ${isCompleted ? 'border-l-[3px] border-l-green-500/50' : ''}
      `}
      data-testid={`campaign-card-${campaign.id}`}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-lg text-white truncate" title={campaign.title}>{campaign.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Created {format(new Date(campaign.createdAt), 'MMM d, yyyy')}
          </p>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap
          ${isDraft ? 'bg-secondary text-muted-foreground border-border' : ''}
          ${isActive ? 'bg-primary/10 text-primary border-primary/20 shadow-[0_0_10px_rgba(255,106,0,0.2)]' : ''}
          ${isCompleted ? 'bg-green-500/10 text-green-400 border-green-500/20' : ''}
        `}>
          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 py-3 border-y border-border/50">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground mb-1">Target</span>
          <span className="font-bold text-white text-lg leading-none">{campaign.targetContacts}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground mb-1">Collected</span>
          <span className="font-bold text-white text-lg leading-none">{campaign.contactsCollected}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground mb-1">Remaining</span>
          <span className="font-bold text-white text-lg leading-none">{Math.max(0, campaign.targetContacts - campaign.contactsCollected)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground font-medium">Progress</span>
          <span className="text-white font-bold">{percent}%</span>
        </div>
        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full ${isCompleted ? 'bg-green-500' : 'bg-primary shadow-[0_0_8px_rgba(255,106,0,0.5)]'}`}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto pt-2">
        <div className="flex items-center gap-1.5">
          <button 
            onClick={handleCopyLink}
            disabled={isDraft}
            className="p-2 text-muted-foreground hover:text-white hover:bg-secondary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed outline-none"
            title="Copy Link"
            data-testid={`btn-copy-${campaign.id}`}
          >
            <Copy className="w-4 h-4" />
          </button>
          <a 
            href={campaign.shareLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`p-2 text-muted-foreground hover:text-white hover:bg-secondary rounded-lg transition-colors outline-none ${isDraft ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
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
            href={`/edit/${campaign.id}`}
            className="p-2 text-muted-foreground hover:text-white hover:bg-secondary rounded-lg transition-colors outline-none"
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
                <AlertDialogTitle className="text-white">Delete Campaign</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  Are you sure you want to delete "{campaign.title}"? This action cannot be undone and will delete all collected contacts.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-secondary text-white hover:bg-secondary/80 border-0">Cancel</AlertDialogCancel>
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