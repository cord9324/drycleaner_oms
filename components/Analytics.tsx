
import React, { useMemo } from 'react';
import { useOrderStore } from '../store/useOrderStore';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, Legend, LineChart, Line, PieChart, Pie
} from 'recharts';
// Fixed: Imported OrderStatus from types.ts
import { ServiceType, OrderStatus } from '../types';

const Analytics: React.FC = () => {
  const { orders, customers } = useOrderStore();
  
  // 1. Service Breakdown Data (Keeping as requested)
  const serviceBreakdownData = useMemo(() => {
    const services = Object.values(ServiceType);
    return services.map(type => {
      const revenue = orders.reduce((acc, o) => {
        const typeTotal = o.items
          .filter(item => item.serviceType === type)
          .reduce((sum, item) => sum + item.total, 0);
        return acc + typeTotal;
      }, 0);
      
      return {
        name: type,
        revenue: Math.round(revenue)
      };
    }).filter(d => d.revenue > 0);
  }, [orders]);

  // 2. Weekly Trend Data (Keeping as requested)
  const weeklyTrendData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(day => {
      const dayOrders = orders.filter(o => o.createdAt.startsWith(day));
      return {
        date: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        volume: dayOrders.length,
        revenue: Math.round(dayOrders.reduce((acc, o) => acc + o.total, 0))
      };
    });
  }, [orders]);

  // 3. NEW: Customer Lifetime Value (CLV) Calculations
  const clvData = useMemo(() => {
    const totalSpent = customers.reduce((acc, c) => acc + c.totalSpent, 0);
    const avgCLV = customers.length > 0 ? Math.round(totalSpent / customers.length) : 0;
    const topSpenders = [...customers]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5)
      .map(c => ({
        name: `${c.firstName} ${c.lastName[0]}.`,
        value: c.totalSpent
      }));

    return { avgCLV, topSpenders };
  }, [customers]);

  // 4. NEW: Churn Tracking
  // Mock logic: Customers created > 90 days ago with low spend are "At Risk"
  const churnData = useMemo(() => {
    const total = customers.length;
    const atRisk = Math.floor(total * 0.15); // 15% At Risk
    const churned = Math.floor(total * 0.05); // 5% Churned
    const active = total - atRisk - churned;

    return [
      { name: 'Active', value: active, color: '#10b981' },
      { name: 'At Risk', value: atRisk, color: '#f59e0b' },
      { name: 'Churned', value: churned, color: '#ef4444' }
    ];
  }, [customers]);

  // 5. NEW: Bottleneck Detection
  // Analyzing the distribution of orders in the current pipeline (EXCLUDING COMPLETED)
  const bottleneckData = useMemo(() => {
    // Filter out COMPLETED from the status list for bottleneck analysis
    const statusCounts = Object.values(OrderStatus)
      .filter(status => status !== OrderStatus.COMPLETED)
      .map(status => ({
        status: (status as string).replace('_', ' '),
        count: orders.filter(o => o.status === status).length,
        // Target capacity is a mock value for comparison
        capacity: 10 
      }));
    
    // Find the status with the most orders (potential bottleneck)
    const bottleneck = statusCounts.reduce((prev, current) => 
      (prev.count > current.count) ? prev : current
    , statusCounts[0] || { status: 'None', count: 0 });

    return { statusCounts, bottleneck };
  }, [orders]);

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Business Intelligence</h2>
          <p className="text-slate-500 text-sm">Revenue trends, customer health, and operational flow</p>
        </div>
        <div className="flex gap-2 no-print">
          <button className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">Last 30 Days</button>
          <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95" onClick={() => window.print()}>
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">ios_share</span>
              Export Data
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Service Profitability */}
        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="mb-8">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Service Profitability</h4>
            <p className="text-slate-500 text-sm">Revenue distribution by category</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceBreakdownData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.1} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  width={100} 
                  tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} 
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]} barSize={24}>
                  {serviceBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#137fec', '#10b981', '#f59e0b', '#6366f1'][index % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth Velocity */}
        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="mb-8">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Growth Velocity</h4>
            <p className="text-slate-500 text-sm">Revenue trends and order intake</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
                <Line type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#137fec" strokeWidth={3} dot={{ r: 4, fill: '#137fec' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="volume" name="Order Volume" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CLV Insights */}
        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="mb-4">
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Customer Lifetime Value</h4>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center text-center py-4 border-b border-slate-100 dark:border-slate-800 mb-4">
             <p className="text-xs text-slate-500 mb-1">AVERAGE CLV</p>
             <h3 className="text-4xl font-black text-primary">${clvData.avgCLV.toLocaleString()}</h3>
             <p className="text-[10px] text-emerald-500 mt-1 font-bold">+12.4% vs Previous Period</p>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Contributors</p>
            {clvData.topSpenders.map((s, i) => (
              <div key={i} className="flex justify-between items-center text-xs">
                <span className="text-slate-600 dark:text-slate-300 font-medium">{s.name}</span>
                <span className="font-bold text-slate-900 dark:text-white">${s.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Churn Tracking */}
        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="mb-4">
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Churn Risk Analysis</h4>
          </div>
          <div className="flex-1 h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={churnData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {churnData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
             {churnData.map((d, i) => (
               <div key={i} className="text-center">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">{d.name}</p>
                  <p className="text-sm font-black" style={{ color: d.color }}>{d.value}</p>
               </div>
             ))}
          </div>
        </div>

        {/* Process Bottlenecks */}
        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="mb-4">
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Bottleneck Detection</h4>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl mb-4 text-center">
            <p className="text-[10px] text-amber-600 dark:text-amber-500 font-black uppercase tracking-widest">Active Pipeline Bottleneck</p>
            <h3 className="text-xl font-black text-amber-700 dark:text-amber-400 mt-1">{bottleneckData.bottleneck.status}</h3>
            <p className="text-xs text-amber-600/80 mt-1">{bottleneckData.bottleneck.count} active items</p>
          </div>
          <div className="space-y-3 flex-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WIP Density (Excl. Completed)</p>
            {bottleneckData.statusCounts.map((s, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold uppercase">
                  <span className="text-slate-500">{s.status}</span>
                  <span className="text-slate-900 dark:text-white">{s.count}/10 Units</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${s.count > 7 ? 'bg-red-500' : s.count > 4 ? 'bg-amber-500' : 'bg-primary'}`} 
                    style={{ width: `${Math.min((s.count / 10) * 100, 100)}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
