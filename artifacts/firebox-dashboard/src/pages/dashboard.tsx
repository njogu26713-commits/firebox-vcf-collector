import { useGetDashboardStats, useListCampaigns } from '@workspace/api-client-react';
import { CampaignCard } from '@/components/campaign-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, FolderOpen, Download, Flame, ArrowRight, Link as LinkIcon, Target, LockOpen } from 'lucide-react';
import { motion } from 'framer-motion';

function StatCard({ title, value, icon: Icon, delay = 0 }: { title: string, value?: number, icon: any, delay?: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-card border border-border rounded-[18px] p-6 flex flex-col justify-between"
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

const steps = [
  { title: "Create Campaign", desc: "Set a target number of contacts and upload your final VCF file.", icon: ArrowRight },
  { title: "Share Unique Link", desc: "Share your dedicated campaign page on social media or in person.", icon: LinkIcon },
  { title: "Collect Contacts", desc: "Visitors submit their name and phone to access the hidden content.", icon: Target },
  { title: "VCF Unlocks", desc: "When the target is reached, the VCF automatically unlocks.", icon: LockOpen },
];

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: campaigns, isLoading: campaignsLoading } = useListCampaigns();

  const activeOrRecentCampaigns = campaigns
    ?.filter(c => c.status === 'active' || c.status === 'draft')
    .slice(0, 3) || [];

  return (
    <div className="space-y-10 pb-10">
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
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-36 rounded-[18px] bg-card border-border" />)
        ) : (
          <>
            <StatCard title="Total Campaigns" value={stats?.totalCampaigns} icon={FolderOpen} delay={0} />
            <StatCard title="Active Campaigns" value={stats?.activeCampaigns} icon={Flame} delay={0.1} />
            <StatCard title="Contacts Collected" value={stats?.totalContactsCollected} icon={Users} delay={0.2} />
            <StatCard title="Downloaded VCFs" value={stats?.downloadedVcfs} icon={Download} delay={0.3} />
          </>
        )}
      </div>

      {/* How it Works */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="bg-card rounded-[20px] p-8 border border-border"
      >
        <h2 className="text-xl font-bold text-foreground mb-8 flex items-center gap-2">
          <Flame className="w-5 h-5 text-primary" />
          How Firebox Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          <div className="hidden md:block absolute top-6 left-10 right-10 h-[2px] bg-secondary" />
          
          {steps.map((step, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-white border-2 border-primary flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(22,163,74,0.25)]">
                <step.icon className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-bold text-foreground mb-2">{step.title}</h4>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Recent Campaigns */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Active & Recent Campaigns</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {campaignsLoading ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-[280px] rounded-[18px] bg-card border-border" />)
          ) : activeOrRecentCampaigns.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-card rounded-[20px] border border-border">
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

      {/* Bottom Banner */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="relative overflow-hidden bg-primary/10 rounded-[20px] p-10 border border-primary/20 flex flex-col items-center justify-center text-center mt-12"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent pointer-events-none" />
        <h3 className="text-6xl md:text-7xl font-extrabold text-primary mb-2 drop-shadow-[0_0_20px_rgba(22,163,74,0.4)]">
          {statsLoading ? '-' : (stats?.totalContactsCollected || 0)}
        </h3>
        <p className="text-xl text-foreground font-medium mb-6">Contacts Remaining to Process</p>
        <div className="flex items-center gap-2 text-primary bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
          <Flame className="w-5 h-5 animate-pulse" />
          <span className="font-bold tracking-wide uppercase text-sm">Firebox Engine Active</span>
        </div>
      </motion.section>
    </div>
  );
}