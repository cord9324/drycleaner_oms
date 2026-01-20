
import React, { useState, useMemo } from 'react';
import { useOrderStore } from '../store/useOrderStore';
import { User } from '../types';

const Attendance: React.FC = () => {
  const { timeLogs, users, currentUser } = useOrderStore();
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
  
  const isManagement = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';

  const filteredLogs = useMemo(() => {
    let logs = [...timeLogs];
    
    // Non-admins can only see their own logs (enforced by RLS, but filtered here for UI)
    if (!isManagement) {
      logs = logs.filter(l => l.user_id === currentUser?.id);
    } else if (selectedUserFilter !== 'all') {
      logs = logs.filter(l => l.user_id === selectedUserFilter);
    }
    
    return logs;
  }, [timeLogs, isManagement, currentUser, selectedUserFilter]);

  const calculateDuration = (start: string, end: string | null) => {
    if (!end) return 'Active...';
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diffMs = endTime - startTime;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHrs}h ${diffMins}m`;
  };

  const getUserName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || 'Unknown User';
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Attendance & Timesheets</h2>
          <p className="text-sm text-slate-500">Track and audit working hours across the team</p>
        </div>
        
        {isManagement && (
          <div className="flex items-center gap-3">
            <div className="relative group">
              <button className="flex h-9 items-center gap-x-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 hover:border-primary transition-colors">
                <span className="material-symbols-outlined text-slate-500 text-[18px]">group</span>
                <span className="text-slate-700 dark:text-white text-xs font-medium">
                  {selectedUserFilter === 'all' ? 'Entire Team' : users.find(u => u.id === selectedUserFilter)?.name}
                </span>
                <span className="material-symbols-outlined text-slate-400 text-[18px]">expand_more</span>
              </button>
              <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl hidden group-hover:block z-20 overflow-hidden">
                <button 
                  onClick={() => setSelectedUserFilter('all')} 
                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-b border-slate-50 dark:border-slate-800"
                >
                  Entire Team
                </button>
                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                  {users.map(u => (
                    <button 
                      key={u.id} 
                      onClick={() => setSelectedUserFilter(u.id)} 
                      className="w-full text-left px-4 py-2.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      {u.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Status Overview</p>
          <div className="flex items-center gap-4">
             <div className="size-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-500 text-3xl font-light">schedule</span>
             </div>
             <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  {timeLogs.filter(l => !l.clock_out).length} Active
                </h3>
                <p className="text-xs text-slate-500">Employees currently working</p>
             </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Today's Logs</p>
          <div className="flex items-center gap-4">
             <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl font-light">history</span>
             </div>
             <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  {timeLogs.filter(l => new Date(l.clock_in).toDateString() === new Date().toDateString()).length} Total
                </h3>
                <p className="text-xs text-slate-500">Sessions recorded today</p>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <tr>
                {isManagement && <th className="px-6 py-4">Employee</th>}
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Clock In</th>
                <th className="px-6 py-4">Clock Out</th>
                <th className="px-6 py-4 text-right">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length > 0 ? filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors group">
                  {isManagement && (
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
                            <img src={users.find(u => u.id === log.user_id)?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${log.user_id}`} alt="user" />
                         </div>
                         <p className="font-bold text-sm text-slate-900 dark:text-white">{getUserName(log.user_id)}</p>
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                    {new Date(log.clock_in).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(log.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {log.clock_out ? (
                      <span className="text-slate-500">
                        {new Date(log.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    ) : (
                      <span className="text-emerald-500 font-black uppercase tracking-tighter text-xs animate-pulse">In Progress</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-sm font-black ${!log.clock_out ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                      {calculateDuration(log.clock_in, log.clock_out)}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No time logs recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
