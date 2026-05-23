'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Layers,
  Calendar,
  Loader2,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { toast } from 'sonner';

interface AnalyticsData {
  stats: {
    totalRooms: number;
    activeBookings: number;
    totalResources: number;
    utilizationRate: number;
  };
  utilizationByRoom: { name: string; value: number }[];
  peakHours: { hour: string; count: number }[];
  resourcePopularity: { name: string; quantity: number }[];
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/admin/analytics');
        if (!response.ok) throw new Error('Failed to load analytics');
        const result = await response.json();
        setData(result);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  // Chart Color Palettes
  const COLORS = ['#8b5cf6', '#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899'];

  return (
    <div className="space-y-8">
      {/* Analytics Meta Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { name: 'Managed Spaces', value: data.stats.totalRooms, desc: 'Active physical rooms', icon: Layers, color: 'text-violet-400' },
          { name: 'Active Bookings', value: data.stats.activeBookings, desc: 'Scheduled events today', icon: Calendar, color: 'text-emerald-400' },
          { name: 'Equipment Assets', value: data.stats.totalResources, desc: 'Total resource pool size', icon: Cpu, color: 'text-indigo-400' },
          { name: 'Utilization Index', value: `${data.stats.utilizationRate}%`, desc: 'Average space occupancy', icon: TrendingUp, color: 'text-amber-400' },
        ].map((card, idx) => (
          <div
            key={idx}
            className="glass-panel relative overflow-hidden rounded-xl p-5 border border-white/5 shadow-md flex items-center gap-4"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/5">
              <card.icon className={`h-6 w-6 ${card.color}`} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{card.name}</p>
              <h3 className="text-2xl font-extrabold text-white mt-0.5">{card.value}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recharts Graphical Visualizers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Space Occupancy Rates Bar Chart */}
        <div className="glass-panel rounded-2xl p-6 border-violet-500/10 shadow-lg space-y-4">
          <div>
            <h3 className="font-display font-bold text-white text-base">Space Occupancy Rate (%)</h3>
            <p className="text-xs text-slate-400">Average weekly room bookings occupancy ratios.</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.utilizationByRoom}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Scheduling Hours Area Chart */}
        <div className="glass-panel rounded-2xl p-6 border-violet-500/10 shadow-lg space-y-4">
          <div>
            <h3 className="font-display font-bold text-white text-base">Peak Scheduling Hours</h3>
            <p className="text-xs text-slate-400">Visualizing reservation bookings volume over the course of a day.</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.peakHours}>
                <XAxis dataKey="hour" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <defs>
                  <linearGradient id="colorHour" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="count" stroke="#6366f1" fillOpacity={1} fill="url(#colorHour)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resource Popularity Share Donut Chart */}
        <div className="glass-panel rounded-2xl p-6 border-violet-500/10 shadow-lg space-y-4 lg:col-span-2">
          <div>
            <h3 className="font-display font-bold text-white text-base">Dynamic Asset Allocations</h3>
            <p className="text-xs text-slate-400">Demonstrates which educational equipment resources are requested most popular.</p>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-around gap-6 pt-4">
            <div className="h-48 w-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.resourcePopularity}
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="quantity"
                  >
                    {data.resourcePopularity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Popularity</span>
                <span className="text-lg font-extrabold text-white">Assets</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1 max-w-md">
              {data.resourcePopularity.map((res, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <div>
                    <p className="text-xs font-semibold text-white truncate max-w-[150px]">{res.name}</p>
                    <p className="text-[10px] text-slate-400">Allocated: {res.quantity} bookings</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
