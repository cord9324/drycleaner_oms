
import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useOrderStore } from '../store/useOrderStore';
import Modal from './Modal';
import CreateOrderForm from './CreateOrderForm';
import { Button } from './ui/Button';
import { ServiceType, OrderItem, Customer } from '../types';
import { supabase } from '../lib/supabase';

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, setSearchQuery, searchQuery, addOrder, addCustomer, updateCustomer, customers, orders, stores, serviceCategories, kanbanColumns, clockIn, clockOut, timeLogs } = useOrderStore();

  const [isOrderModalOpen, setOrderModalOpen] = useState(false);

  const isClockedIn = useMemo(() => {
    if (!currentUser) return false;
    return !!timeLogs.find(log => log.user_id === currentUser.id && !log.clock_out);
  }, [timeLogs, currentUser]);

  const handleLogout = async () => { await supabase.auth.signOut(); };


  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.toLowerCase().trim();

    // 1. Check for exact order number match (priority) - Support "ORD-0001" or just "0001"
    const exactOrder = orders.find(o =>
      o.orderNumber.toLowerCase() === query ||
      o.orderNumber.toLowerCase() === `ord-${query}` ||
      o.id.toLowerCase() === query
    );

    if (exactOrder) {
      navigate(`/orders/${exactOrder.id}`);
      return;
    }

    // 2. Check for order partial matches (to decide if we should go to Order Board)
    // Matches logic in KanbanBoard.tsx
    const orderMatches = orders.filter(o =>
      o.orderNumber.toLowerCase().includes(query) ||
      o.customerName.toLowerCase().includes(query) ||
      o.hangerNumber?.toLowerCase().includes(query)
    );

    // 3. Check for customer matches
    // Matches logic in CustomerList.tsx
    const customerMatches = customers.filter(c =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      c.phone.includes(query)
    );

    // Navigation Logic:
    // - If we have order matches -> Go to Orders (primary view)
    // - Else if hits in customers -> Go to Customers
    // - Default -> Go to Orders if on a generic page

    if (orderMatches.length > 0) {
      if (!location.pathname.includes('/orders')) {
        navigate('/orders');
      }
      return;
    }

    if (customerMatches.length > 0) {
      if (!location.pathname.includes('/customers')) {
        navigate('/customers');
      }
      return;
    }

    // Default: If on a non-searchable page (Dashboard, Attendance, Settings), go to Orders
    const searchablePages = ['/orders', '/customers'];
    if (!searchablePages.some(page => location.pathname.includes(page))) {
      navigate('/orders');
    }
  };

  const navItems = useMemo(() => [
    { label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { label: 'Order Board', icon: 'view_kanban', path: '/orders' },
    { label: 'Customers', icon: 'groups', path: '/customers' },
    { label: 'Attendance', icon: 'history_toggle_off', path: '/attendance' },
    { label: 'Analytics', icon: 'bar_chart', path: '/analytics' },
    { label: 'Settings', icon: 'settings', path: '/settings' },
  ], []);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-64 flex-col justify-between border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark p-4 shrink-0">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-3 px-2">
            <div className="bg-primary rounded-lg p-1.5 flex items-center justify-center"><span className="material-symbols-outlined text-white text-2xl">dry_cleaning</span></div>
            <div className="flex flex-col">
              <h1 className="text-slate-900 dark:text-white text-base font-bold leading-tight">DryClean Pro</h1>
              <p className="text-slate-500 dark:text-[#9dabb9] text-xs font-normal">Management System</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${location.pathname.startsWith(item.path) ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-[#9dabb9] hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: location.pathname.startsWith(item.path) ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-4 mt-auto">
          {/* Time Clock Status Widget */}
          <div className="px-2">
            <button
              onClick={() => isClockedIn ? clockOut() : clockIn()}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all ${isClockedIn ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-500'}`}
            >
              <div className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${isClockedIn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest">{isClockedIn ? 'Clocked In' : 'Clocked Out'}</span>
              </div>
              <span className="material-symbols-outlined text-[18px]">{isClockedIn ? 'logout' : 'login'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 ring-2 ring-primary/20">
                <img
                  alt="avatar"
                  src={currentUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.name || 'User'}`}
                  onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=fallback`; }}
                />
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate" title={currentUser?.name}>
                  {currentUser?.name || 'Loading...'}
                </p>
                {currentUser && (
                  <p className="text-[10px] text-slate-500 truncate uppercase font-black tracking-tight">
                    {currentUser.role}
                  </p>
                )}
              </div>
            </div>
            <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"><span className="material-symbols-outlined text-[18px]">logout</span></button>
          </div>
          <button onClick={() => setOrderModalOpen(true)} className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary h-10 px-4 text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">
            <span className="material-symbols-outlined text-[20px]">add</span><span className="truncate">New Order</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-background-dark">
        <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark px-8 py-3 shrink-0">
          <div className="flex items-center gap-6">
            <h2 className="text-slate-900 dark:text-white text-xl font-bold tracking-tight">{navItems.find(n => location.pathname.startsWith(n.path))?.label || 'Overview'}</h2>
            <form onSubmit={handleSearchSubmit} className="relative w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-100 dark:bg-slate-900 border-none text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary" placeholder="Search orders..." type="text" />
            </form>
          </div>
        </header>
        <div className="flex-1 overflow-auto custom-scrollbar"><Outlet /></div>
      </main>

      <Modal isOpen={isOrderModalOpen} onClose={() => setOrderModalOpen(false)} title="Create New Order">
        {isOrderModalOpen && <CreateOrderForm onClose={() => setOrderModalOpen(false)} />}
      </Modal>
    </div>
  );
};

export default Layout;
