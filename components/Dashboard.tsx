
import React, { useMemo } from 'react';
import { useOrderStore } from '../store/useOrderStore';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { OrderStatus } from '../types';

const Dashboard: React.FC = () => {
  const { orders, customers } = useOrderStore();

  const kpis = useMemo(() => {
    // 1. Revenue & Orders - Filtered by COMPLETED status as requested
    const completedOrders = orders.filter(o => o.status === OrderStatus.COMPLETED);
    const totalRevenue = completedOrders.reduce((acc, o) => acc + o.total, 0);
    const pendingPickups = orders.filter(o => o.status === OrderStatus.READY).length;

    // 2. Dynamic Customer Growth Calculation
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const newCustomersThisPeriod = customers.filter(c => new Date(c.createdAt) >= thirtyDaysAgo).length;

    return [
      { label: 'Live Orders', value: orders.length, icon: 'shopping_basket', color: 'primary' },
      { label: 'Store Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: 'payments', color: 'primary' },
      { label: 'Pending Pickups', value: pendingPickups, icon: 'local_shipping', color: 'orange-500' },
      { label: 'Customer Growth', value: `${newCustomersThisPeriod} New`, icon: 'person_add', color: 'primary' },
    ];
  }, [orders, customers]);

  // Process data for Revenue Area Chart (Last 7 Days)
  // Matching the KPI logic to show completed revenue trends for consistency
  const revenueChartData = useMemo(() => {
    const days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return days.map(day => {
      const dayOrders = orders.filter(o => o.createdAt.startsWith(day) && o.status === OrderStatus.COMPLETED);
      return {
        name: new Date(day).toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: dayOrders.reduce((acc, o) => acc + o.total, 0),
        orders: dayOrders.length
      };
    });
  }, [orders]);

  // Process data for Status Pie Chart
  const statusData = useMemo(() => {
    return Object.values(OrderStatus).map(status => ({
      name: (status as string).replace('_', ' '),
      value: orders.filter(o => o.status === status).length
    })).filter(s => s.value > 0);
  }, [orders]);

  const COLORS = ['#137fec', '#3b82f6', '#10b981', '#64748b', '#ef4444'];

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-[#1a1d23] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-transform hover:scale-[1.02]">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg ${kpi.color === 'primary' ? 'bg-primary/10 text-primary' : 'bg-orange-500/10 text-orange-500'}`}>
                <span className="material-symbols-outlined">{kpi.icon}</span>
              </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{kpi.label}</p>
            <h3 className="text-2xl font-bold mt-1 dark:text-white">{kpi.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#1a1d23] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Revenue Performance</h4>
              <p className="text-slate-400 text-xs mt-1">Realized income trends (Completed orders)</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#137fec" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#137fec" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#137fec' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#137fec" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1d23] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h4 className="text-base font-bold mb-6 text-slate-900 dark:text-white">Order Status Distribution</h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
             <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Active Pipeline</span>
                <span className="font-bold text-primary">{orders.length} Orders</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
