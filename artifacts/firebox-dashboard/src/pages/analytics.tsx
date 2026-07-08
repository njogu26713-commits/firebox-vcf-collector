import { useGetCampaignAnalytics } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area
} from 'recharts';

export default function Analytics() {
  const { data: analytics, isLoading } = useGetCampaignAnalytics();

  const chartData = analytics?.map(c => ({
    name: c.title.length > 15 ? c.title.substring(0, 15) + '...' : c.title,
    collected: c.contactsCollected,
    target: c.targetContacts,
    percent: c.progressPercent,
    fullTitle: c.title
  })) || [];

  return (
    <div className="space-y-8 pb-10">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">Analytics Overview</h1>
        <p className="text-muted-foreground">Track contact collection performance across your campaigns.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contacts Collected Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-card border border-border rounded-[20px] p-6 h-[400px] flex flex-col"
        >
          <h3 className="text-lg font-bold text-foreground mb-6">Contacts Collected per Campaign</h3>
          <div className="flex-1 min-h-0 w-full">
            {isLoading ? (
              <Skeleton className="w-full h-full bg-secondary/50 rounded-lg" />
            ) : chartData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(22,163,74,0.06)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white border border-border p-3 rounded-lg shadow-xl">
                            <p className="text-foreground font-medium mb-1">{payload[0].payload.fullTitle}</p>
                            <p className="text-primary font-bold">{payload[0].value} contacts</p>
                            <p className="text-muted-foreground text-xs mt-1">Target: {payload[0].payload.target}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="collected" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.percent >= 100 ? '#16a34a' : '#22c55e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Progress Area Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-card border border-border rounded-[20px] p-6 h-[400px] flex flex-col"
        >
          <h3 className="text-lg font-bold text-foreground mb-6">Completion Progress (%)</h3>
          <div className="flex-1 min-h-0 w-full">
            {isLoading ? (
              <Skeleton className="w-full h-full bg-secondary/50 rounded-lg" />
            ) : chartData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorPercent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white border border-border p-3 rounded-lg shadow-xl">
                            <p className="text-foreground font-medium mb-1">{payload[0].payload.fullTitle}</p>
                            <p className="text-primary font-bold">{payload[0].value}% Complete</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="percent" 
                    stroke="#16a34a" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorPercent)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>

      {/* Detail Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="bg-card border border-border rounded-[20px] overflow-hidden"
      >
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">Campaign Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">Campaign</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Target</th>
                <th className="px-6 py-4 font-medium text-right">Collected</th>
                <th className="px-6 py-4 font-medium text-right">Progress</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32 bg-secondary" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16 bg-secondary" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-12 ml-auto bg-secondary" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-12 ml-auto bg-secondary" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16 ml-auto bg-secondary" /></td>
                  </tr>
                ))
              ) : analytics?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No analytics data available.
                  </td>
                </tr>
              ) : (
                analytics?.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{c.title}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border
                        ${c.status === 'draft' ? 'bg-secondary text-muted-foreground border-border' : ''}
                        ${c.status === 'active' ? 'bg-primary/10 text-primary border-primary/20' : ''}
                        ${c.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' : ''}
                      `}>
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground">{c.targetContacts.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-bold text-foreground">{c.contactsCollected.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`font-bold ${c.progressPercent >= 100 ? 'text-green-400' : 'text-primary'}`}>
                          {c.progressPercent}%
                        </span>
                        <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden hidden sm:block">
                          <div 
                            className={`h-full ${c.progressPercent >= 100 ? 'bg-green-500' : 'bg-primary'}`} 
                            style={{ width: `${Math.min(100, c.progressPercent)}%` }} 
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}