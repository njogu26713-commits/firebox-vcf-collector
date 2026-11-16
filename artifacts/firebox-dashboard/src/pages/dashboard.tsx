import { getGetDashboardStatsQueryKey, getListCampaignsQueryKey, useGetDashboardStats, useListCampaigns } from '@workspace/api-client-react';
import { CampaignCard } from '@/components/campaign-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, FolderOpen, Download, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/auth';

function StatCard({ title, value, icon: Icon, delay = 0 }: { title: string, value?: number, icon: any, delay?: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-card border border-border rounded-[5px] p-6 flex flex-col justify-between"
    >
      <div className="flex items-start justify-between">
        <p className="text-muted-foreground font-medium text-sm">{title}</p>
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary/80" />
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-4xl font-bold text-foreground">{value !== undefined ? value.toLocaleString() : '-'}</h3>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const userQueryKey = user?.id ?? 'signed-out';
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({
    query: { queryKey: [...getGetDashboardStatsQueryKey(), userQueryKey] },
  });
  const { data: campaigns, isLoading: campaignsLoading } = useListCampaigns({
    query: { queryKey: [...getListCampaignsQueryKey(), userQueryKey] },
  });

  const activeOrRecentCampaigns = campaigns
    ?.filter(c => c.status === 'active' || c.status === 'draft')
    .slice(0, 3) || [];

  return (
    <div className="space-y-4 pb-10">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground text-lg">Welcome back. Here's what's happening with your VCF campaigns.</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-36 rounded-[5px] bg-card border-border" />)
        ) : (
          <>
            <StatCard title="Total Campaigns" value={stats?.totalCampaigns} icon={FolderOpen} delay={0} />
            <StatCard title="Active Campaigns" value={stats?.activeCampaigns} icon={Flame} delay={0.1} />
            <StatCard title="Contacts Collected" value={stats?.totalContactsCollected} icon={Users} delay={0.2} />
            <StatCard title="Downloaded VCFs" value={stats?.downloadedVcfs} icon={Download} delay={0.3} />
          </>
        )}
      </div>

      {/* Recent Campaigns */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Active & Recent Campaigns</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-1">
          {campaignsLoading ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-[280px] rounded-[5px] bg-card border-border" />)
          ) : activeOrRecentCampaigns.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-card rounded-[5px] border border-border">
              <div className="w-16 h-16 rounded-full bg-secondary mx-auto flex items-center justify-center mb-4">
                <FolderOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">No active campaigns</h3>
              <p className="text-muted-foreground">You don't have any active campaigns right now. Create one to start collecting contacts.</p>
            </div>
          ) : (
            activeOrRecentCampaigns.map((c, i) => <CampaignCard key={c.id} campaign={c} index={i} />)
          )}
        </div>
      </section>

    </div>
  );
}
