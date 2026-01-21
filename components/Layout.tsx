
import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useOrderStore } from '../store/useOrderStore';
import Modal from './Modal';
import { Button } from './ui/Button';
import { ServiceType, OrderItem, Customer } from '../types';
import { supabase } from '../lib/supabase';

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, setSearchQuery, searchQuery, addOrder, addCustomer, updateCustomer, customers, stores, serviceCategories, kanbanColumns, clockIn, clockOut, timeLogs } = useOrderStore();

  const [isOrderModalOpen, setOrderModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ firstName: '', lastName: '', phone: '', email: '', notes: '' });
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [hangerNumber, setHangerNumber] = useState('');

  const [orderItems, setOrderItems] = useState<Partial<OrderItem>[]>([
    { id: Math.random().toString(36).substr(2, 9), category: '', quantity: 1, unitPrice: 0, total: 0 }
  ]);
  const [isPriority, setIsPriority] = useState(false);
  const [pickupDate, setPickupDate] = useState(new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);
  const [pickupTime, setPickupTime] = useState('17:00');
  const [specialHandling, setSpecialHandling] = useState('');

  const isClockedIn = useMemo(() => {
    if (!currentUser) return false;
    return !!timeLogs.find(log => log.user_id === currentUser.id && !log.clock_out);
  }, [timeLogs, currentUser]);

  useEffect(() => {
    if (stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, isOrderModalOpen, selectedStoreId]);

  const handleLogout = async () => { await supabase.auth.signOut(); };

  const handleAddItem = () => {
    setOrderItems([...orderItems, { id: Math.random().toString(36).substr(2, 9), category: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const handleRemoveItem = (id: string) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: string, value: any) => {
    setOrderItems(orderItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'category') {
          const cat = serviceCategories.find(c => c.name === value);
          if (cat) {
            updatedItem.unitPrice = cat.basePrice;
            updatedItem.serviceType = cat.serviceType;
          }
        }
        updatedItem.total = (updatedItem.unitPrice || 0) * (updatedItem.quantity || 0);
        return updatedItem;
      }
      return item;
    }));
  };

  const calculateSubtotal = () => orderItems.reduce((acc, item) => acc + (item.total || 0), 0);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    let customer: Customer | undefined;
    const now = new Date().toISOString();

    try {
      if (isNewCustomer) {
        const newId = `c${Date.now()}`;
        customer = {
          id: newId,
          firstName: newCustomerData.firstName,
          lastName: newCustomerData.lastName,
          phone: newCustomerData.phone,
          email: newCustomerData.email || '',
          address: 'N/A',
          notes: newCustomerData.notes,
          totalSpent: 0,
          createdAt: now
        };
        await addCustomer(customer);
      } else {
        customer = customers.find(c => c.id === selectedCustomerId);
        if (customer) {
          await updateCustomer(customer.id, {
            lastOrderDate: now,
            totalSpent: (customer.totalSpent || 0) + (calculateSubtotal() * 1.08)
          });
        }
      }

      if (!customer) throw new Error("Customer missing");

      const subtotal = calculateSubtotal();
      const tax = subtotal * 0.08;
      const finalItems = orderItems.map(item => ({
        ...item,
        id: item.id!,
        category: item.category!,
        serviceType: item.serviceType || ServiceType.DRY_CLEAN,
        quantity: item.quantity!,
        unitPrice: item.unitPrice!,
        total: item.total!
      })) as OrderItem[];

      const initialStatus = kanbanColumns.length > 0 ? kanbanColumns[0].status : 'RECEIVED';

      await addOrder({
        id: Math.random().toString(36).substr(2, 9),
        orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        hangerNumber: hangerNumber.trim() || undefined,
        customerId: customer.id,
        customerName: `${customer.firstName} ${customer.lastName}`,
        status: initialStatus,
        items: finalItems,
        subtotal,
        tax,
        total: subtotal + tax,
        createdAt: now,
        pickupDate: pickupDate,
        pickupTime: pickupTime,
        isPriority,
        storeId: selectedStoreId || stores[0]?.id || 's1',
        specialHandling: specialHandling.trim()
      });

      setOrderModalOpen(false);
      navigate('/orders');
      setHangerNumber('');
      setSpecialHandling('');
      setIsPriority(false);
    } catch (err) {
      console.error("Failed to create order", err);
      alert("Error creating order. Please ensure all fields are valid.");
    } finally {
      setIsSubmitting(false);
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
            <div className="relative w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-100 dark:bg-slate-900 border-none text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary" placeholder="Search orders..." type="text" />
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto custom-scrollbar"><Outlet /></div>
      </main>

      <Modal isOpen={isOrderModalOpen} onClose={() => setOrderModalOpen(false)} title="Create New Order">
        {/* Form contents remain unchanged */}
        <form onSubmit={handleCreateOrder} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Intake Store</label>
              <select required className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm" value={selectedStoreId} onChange={(e) => setSelectedStoreId(e.target.value)}>
                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center"><label className="text-[10px] font-bold text-slate-400 uppercase">Customer</label><button type="button" onClick={() => setIsNewCustomer(!isNewCustomer)} className="text-primary text-[10px] font-bold uppercase">{isNewCustomer ? 'Existing' : 'New Client'}</button></div>
              {!isNewCustomer ? (
                <select required className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}>
                  <option value="">Choose Existing...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                </select>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input required placeholder="First" className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs" value={newCustomerData.firstName} onChange={(e) => setNewCustomerData({ ...newCustomerData, firstName: e.target.value })} />
                    <input required placeholder="Last" className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs" value={newCustomerData.lastName} onChange={(e) => setNewCustomerData({ ...newCustomerData, lastName: e.target.value })} />
                  </div>
                  <input required placeholder="Phone (Required)" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs" value={newCustomerData.phone} onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })} />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center"><label className="text-[10px] font-bold text-slate-400 uppercase">Order Items</label><button type="button" onClick={handleAddItem} className="text-primary text-[10px] font-bold uppercase">+ Add Line</button></div>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {orderItems.map(item => (
                <div key={item.id} className="grid grid-cols-12 gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="col-span-7">
                    <select required className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1 text-xs" value={item.category} onChange={(e) => handleItemChange(item.id!, 'category', e.target.value)}>
                      <option value="">Select Service...</option>
                      {serviceCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.name} (${cat.basePrice})</option>)}
                    </select>
                  </div>
                  <div className="col-span-2"><input type="number" min="1" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1 text-xs" value={item.quantity} onChange={(e) => handleItemChange(item.id!, 'quantity', parseInt(e.target.value))} /></div>
                  <div className="col-span-2 text-right text-xs font-bold pt-1.5">${(item.total || 0).toFixed(2)}</div>
                  <div className="col-span-1 flex items-center justify-center"><button type="button" onClick={() => handleRemoveItem(item.id!)} className="text-slate-400 hover:text-red-500"><span className="material-symbols-outlined text-[16px]">close</span></button></div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Logistics</label>
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Hanger #" className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs" value={hangerNumber} onChange={(e) => setHangerNumber(e.target.value)} />
                <div className={`flex items-center justify-center gap-2 rounded-lg border px-2 h-[34px] transition-colors cursor-pointer ${isPriority ? 'bg-amber-500/10 border-amber-500 text-amber-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-400'}`} onClick={() => setIsPriority(!isPriority)}>
                  <span className="material-symbols-outlined text-[16px]">{isPriority ? 'bolt' : 'schedule'}</span>
                  <span className="text-[10px] font-bold uppercase">{isPriority ? 'Priority' : 'Normal'}</span>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Estimated Pickup</label>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
                <input type="time" className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Special Handling / Notes</label>
            <textarea placeholder="e.g. Grass stain on collar, extra starch, delicate buttons..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs h-16 focus:ring-2 focus:ring-primary/20 outline-none" value={specialHandling} onChange={(e) => setSpecialHandling(e.target.value)} />
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-end">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Estimated Total</p>
              <p className="text-2xl font-black text-primary">${(calculateSubtotal() * 1.08).toFixed(2)}</p>
            </div>
            <Button type="submit" isLoading={isSubmitting} size="lg">Create Order</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Layout;
