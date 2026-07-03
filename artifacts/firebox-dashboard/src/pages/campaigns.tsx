import { useState } from 'react';
import { useListCampaigns } from '@workspace/api-client-react';
import { CampaignCard } from '@/components/campaign-card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { PlusCircle, SearchX } from 'lucide-react';

export default function Campaigns() {
  const [filter, setFilter] = useState<'all' | 'draft' | 'active' | 'completed'>('all');
  const { data: campaigns, isLoading } = useListCampaigns();

  const filtered = campaigns?.filter(c => filter === 'all' || c.status === filter) || [];

  const TABS = [
    { id: 'all', label: 'All Campaigns' },
    { id: 'active', label: 'Active' },
    { id: 'draft', label: 'Drafts' },
    { id: 'completed', label: 'Completed' },
  ] as const;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">My VCF Campaigns</h1>
          <p className="text-muted-foreground">Manage your locked contact cards and track progress.</p>
        </div>
        <Link 
          href="/create"
          className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-lg font-medium transition-all hover:shadow-[0_0_15px_rgba(255,106,0,0.3)] outline-none"
        >
          <PlusCircle className="w-5 h-5" />
          New Campaign
        </Link>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-card rounded-xl border border-border inline-flex">
         {TABS.map(tab => (
           <button 
             key={tab.id} 
             onClick={() => setFilter(tab.id as any)} 
             className={`
               px-5 py-2 rounded-lg text-sm font-semibold transition-all outline-none relative
               ${filter === tab.id ? 'text-white' : 'text-muted-foreground hover:text-white hover:bg-secondary/50'}
             `}
           >
             {filter === tab.id && (
               <motion.div 
                 layoutId="activeTab"
                 className="absolute inset-0 bg-secondary border border-border rounded-lg -z-10"
                 transition={{ type: "spring", stiffness: 400, damping: 30 }}
               />
             )}
             <span className="relative z-10">{tab.label}</span>
           </button>
         ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-[280px] rounded-[18px] bg-card border-border" />)
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.length > 0 ? (
              filtered.map((c, i) => (
                <CampaignCard key={c.id} campaign={c} index={i} />
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="col-span-full py-20 flex flex-col items-center justify-center bg-card rounded-[20px] border border-border text-center"
              >
                <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
                  <SearchX className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No campaigns found</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  {filter === 'all' 
                    ? "You haven't created any campaigns yet." 
                    : `You don't have any ${filter} campaigns.`}
                </p>
                {filter !== 'all' && (
                  <button 
                    onClick={() => setFilter('all')}
                    className="text-primary hover:text-white font-medium transition-colors"
                  >
                    View all campaigns
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}